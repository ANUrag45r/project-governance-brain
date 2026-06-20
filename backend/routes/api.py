from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
import time
import json
import datetime
from database import get_db

# Import Models
from models.meeting import Meeting
from models.action import Action
from models.risk import Risk
from models.decision import Decision
from models.skill import Skill
from models.report import Report
from models.user import User

# Import Schemas
from schemas.meeting import MeetingUploadRequest
from schemas.action import ActionCreate, ActionUpdate
from schemas.query import QueryRequest, QueryResponse
from schemas.auth import UserLoginRequest

# Import Services
from services.hermes_service import HermesService
from services.gbrain_service import GBrainService
from services.gstack_service import GStackService
from services.teams_service import TeamsService
from services.outlook_service import OutlookService

router = APIRouter()

hermes_service = HermesService()
gbrain_service = GBrainService()
gstack_service = GStackService()
teams_service = TeamsService()
outlook_service = OutlookService()

# ----------------- AUTHENTICATION -----------------

@router.post("/auth/login")
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    # Simple mock authentication
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Create a default user if not exists
        user = User(
            name="Prerit Nag",
            email=request.email,
            tenant_id="microsoft-tenant-90210",
            role="Project Manager"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {
        "access_token": "mock-jwt-token-governance-brain",
        "token_type": "bearer",
        "username": user.name,
        "email": user.email
    }

@router.post("/auth/logout")
def logout():
    return {"status": "success", "message": "Logged out successfully"}

@router.get("/auth/profile")
def get_profile(db: Session = Depends(get_db)):
    # Returns default project manager profile
    user = db.query(User).first()
    if not user:
        user = User(
            name="Prerit Nag",
            email="prerit.nag@governance.ai",
            tenant_id="microsoft-tenant-90210",
            role="Project Manager"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "tenant_id": user.tenant_id,
        "role": user.role
    }

# ----------------- DASHBOARD -----------------

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    total_meetings = db.query(Meeting).count()
    total_decisions = db.query(Decision).count()
    open_actions = db.query(Action).filter(Action.status != "Done").count()
    risks_count = db.query(Risk).count()

    # Calculate Project Health Score (from GStack)
    health_result = gstack_service.execute_workflow(db, "Sprint Health Analyzer Skill")
    health_score = health_result.get("health_score", 90)

    # Compile recent activity list based on database items
    recent_activities = []
    
    # Grab recent meetings
    meetings = db.query(Meeting).order_by(desc(Meeting.created_at)).limit(3).all()
    for m in meetings:
        recent_activities.append({
            "id": len(recent_activities) + 1,
            "type": "meeting",
            "title": f"Meeting Analyzed: {m.title}",
            "subtitle": f"Source: {m.source}",
            "time": m.created_at.strftime("%b %d, %H:%M") if m.created_at else "Recently"
        })
        
    # Grab recent decisions
    decisions = db.query(Decision).order_by(desc(Decision.decision_id)).limit(2).all()
    for d in decisions:
        m = db.query(Meeting).filter(Meeting.meeting_id == d.meeting_id).first()
        recent_activities.append({
            "id": len(recent_activities) + 1,
            "type": "decision",
            "title": f"New Decision: {d.description}",
            "subtitle": f"Meeting: {m.title if m else 'Sync'}",
            "time": "Recently"
        })

    # Default trends point data (meetings count grouped by month)
    # Simple hardcoded month aggregation for trends chart
    trends = [
        {"month": "Jun", "meetings": min(total_meetings, 5)},
        {"month": "Jul", "meetings": min(total_meetings + 2, 8)},
        {"month": "Aug", "meetings": min(total_meetings + 5, 12)},
        {"month": "Sep", "meetings": total_meetings}
    ]

    return {
        "total_meetings": total_meetings,
        "total_decisions": total_decisions,
        "open_actions": open_actions,
        "risks_count": risks_count,
        "health_score": health_score,
        "recent_activities": recent_activities,
        "trends": trends
    }

# ----------------- MEETINGS -----------------

@router.post("/meetings/upload")
def upload_meeting(request: MeetingUploadRequest, db: Session = Depends(get_db)):
    def generate():
        # Step 1: Uploading transcript
        yield f"data: {json.dumps({'status': 'Ingesting transcript into GBrain...'})}\n\n"
        time.sleep(1.0)

        # Step 2: Simulate GBrain processing
        yield f"data: {json.dumps({'status': 'Analyzing with Hermes Meeting Agent...'})}\n\n"
        
        # Run real Hermes Meeting Analyzer NLP
        extracted = hermes_service.analyze_meeting(request.title, request.transcript)
        time.sleep(1.0)
        
        yield f"data: {json.dumps({'status': 'Generating memory nodes and relationships...'})}\n\n"
        
        # Save Meeting
        new_meeting = Meeting(
            title=request.title,
            source="Manual Upload",
            summary=extracted["summary"],
            transcript=request.transcript
        )
        db.add(new_meeting)
        db.commit()
        db.refresh(new_meeting)

        # Decisions
        for dec_data in extracted["decisions"]:
            decision = Decision(
                meeting_id=new_meeting.meeting_id,
                description=dec_data["description"],
                owner=dec_data["owner"]
            )
            db.add(decision)
            db.commit()
            db.refresh(decision)
            
            # Store relation
            gbrain_service.store_relation(
                db, 
                source_type="meeting", 
                source_id=new_meeting.meeting_id,
                target_type="decision", 
                target_id=decision.decision_id,
                relationship_type="MEETING_HAS_DECISION"
            )

        # Actions
        for act_data in extracted["actions"]:
            action = Action(
                meeting_id=new_meeting.meeting_id,
                task=act_data["task"],
                owner=act_data["owner"],
                status=act_data["status"],
                due_date=act_data["due_date"]
            )
            db.add(action)
            db.commit()
            db.refresh(action)
            
            # Store relations
            gbrain_service.store_relation(
                db,
                source_type="action",
                source_id=action.action_id,
                target_type="owner",
                target_id=1,
                relationship_type="ACTION_ASSIGNED_TO"
            )
            
            for d in db.query(Decision).filter(Decision.meeting_id == new_meeting.meeting_id).all():
                gbrain_service.store_relation(
                    db,
                    source_type="decision",
                    source_id=d.decision_id,
                    target_type="action",
                    target_id=action.action_id,
                    relationship_type="DECISION_HAS_ACTION"
                )

        # Risks
        for risk_data in extracted["risks"]:
            risk = Risk(
                meeting_id=new_meeting.meeting_id,
                description=risk_data["description"],
                severity=risk_data["severity"]
            )
            db.add(risk)
            db.commit()
            db.refresh(risk)
            
            # Store relation
            gbrain_service.store_relation(
                db,
                source_type="meeting",
                source_id=new_meeting.meeting_id,
                target_type="risk",
                target_id=risk.risk_id,
                relationship_type="MEETING_GENERATES_RISK"
            )
            
            for a in db.query(Action).filter(Action.meeting_id == new_meeting.meeting_id).all():
                gbrain_service.store_relation(
                    db,
                    source_type="action",
                    source_id=a.action_id,
                    target_type="risk",
                    target_id=risk.risk_id,
                    relationship_type="ACTION_HAS_RISK"
                )

        time.sleep(1.0)
        yield f"data: {json.dumps({'status': 'Complete', 'meeting_id': new_meeting.meeting_id})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.get("/meetings")
def get_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).all()
    result = []
    for m in meetings:
        decisions = db.query(Decision).filter(Decision.meeting_id == m.meeting_id).all()
        actions = db.query(Action).filter(Action.meeting_id == m.meeting_id).all()
        risks = db.query(Risk).filter(Risk.meeting_id == m.meeting_id).all()
        
        result.append({
            "id": m.meeting_id,
            "title": m.title,
            "date": m.created_at.strftime("%b %d, %Y") if m.created_at else "Unknown",
            "summary": m.summary,
            "transcript": m.transcript,
            "participants": ["Alice", "Bob", "Charlie"], 
            "decisions": len(decisions),
            "actions": len(actions),
            "risks": len(risks)
        })
    return result

@router.get("/meetings/{meeting_id}")
def get_meeting_detail(meeting_id: int, db: Session = Depends(get_db)):
    m = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    decisions = db.query(Decision).filter(Decision.meeting_id == m.meeting_id).all()
    actions = db.query(Action).filter(Action.meeting_id == m.meeting_id).all()
    risks = db.query(Risk).filter(Risk.meeting_id == m.meeting_id).all()
    
    return {
        "id": m.meeting_id,
        "title": m.title,
        "date": m.created_at.strftime("%b %d, %Y") if m.created_at else "Unknown",
        "summary": m.summary,
        "transcript": m.transcript,
        "participants": ["Alice", "Bob", "Charlie", "David"],
        "decisions": [d.description for d in decisions],
        "actions": [{"task": a.task, "owner": a.owner, "status": a.status} for a in actions],
        "risks": [r.description for r in risks]
    }

# ----------------- ACTIONS -----------------

@router.get("/actions")
def get_actions(db: Session = Depends(get_db)):
    actions = db.query(Action).all()
    result = []
    for a in actions:
        m = db.query(Meeting).filter(Meeting.meeting_id == a.meeting_id).first()
        result.append({
            "id": a.action_id,
            "task": a.task,
            "owner": a.owner,
            "status": a.status,
            "date": a.due_date.strftime("%b %d, %Y") if a.due_date else "Unknown",
            "meeting": m.title if m else "General Workspace"
        })
    return result

@router.post("/actions")
def create_action(request: ActionCreate, db: Session = Depends(get_db)):
    # Creating an unlinked action (representing a manual user-created card)
    new_action = Action(
        task=request.task,
        owner=request.owner,
        status=request.status,
        due_date=request.due_date or (datetime.datetime.now() + datetime.timedelta(days=7))
    )
    db.add(new_action)
    db.commit()
    db.refresh(new_action)
    
    # Store in Graph memory
    gbrain_service.store_relation(
        db,
        source_type="action",
        source_id=new_action.action_id,
        target_type="owner",
        target_id=1,
        relationship_type="ACTION_ASSIGNED_TO"
    )

    return {
        "id": new_action.action_id,
        "task": new_action.task,
        "owner": new_action.owner,
        "status": new_action.status,
        "date": new_action.due_date.strftime("%b %d, %Y") if new_action.due_date else "Unknown",
        "meeting": "General Workspace"
    }

@router.put("/actions/{action_id}")
def update_action(action_id: int, request: ActionUpdate, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.action_id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if request.task is not None:
        action.task = request.task
    if request.owner is not None:
        action.owner = request.owner
    if request.status is not None:
        action.status = request.status
    if request.due_date is not None:
        action.due_date = request.due_date
        
    db.commit()
    db.refresh(action)
    
    m = db.query(Meeting).filter(Meeting.meeting_id == action.meeting_id).first()
    return {
        "id": action.action_id,
        "task": action.task,
        "owner": action.owner,
        "status": action.status,
        "date": action.due_date.strftime("%b %d, %Y") if action.due_date else "Unknown",
        "meeting": m.title if m else "General Workspace"
    }

# ----------------- RISKS -----------------

@router.get("/risks")
def get_risks(db: Session = Depends(get_db)):
    risks = db.query(Risk).all()
    result = []
    for r in risks:
        m = db.query(Meeting).filter(Meeting.meeting_id == r.meeting_id).first()
        result.append({
            "id": r.risk_id,
            "description": r.description,
            "severity": r.severity,
            "status": "Active",
            "detected": m.created_at.strftime("%b %d, %Y") if m and m.created_at else "Unknown",
            "meeting": m.title if m else "General Workspace"
        })
    return result

# ----------------- REPORTS -----------------

@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(desc(Report.created_at)).all()
    result = []
    for r in reports:
        result.append({
            "id": r.report_id,
            "type": "Weekly Governance Report",
            "dateRange": r.week,
            "healthScore": r.health_score or 90,
            "summary": r.summary,
            "metrics": {
                "meetings": r.meetings_count or 0,
                "decisions": r.decisions_count or 0,
                "completedActions": r.completed_actions_count or 0,
                "newRisks": r.new_risks_count or 0
            }
        })
    return result

@router.post("/reports/generate")
def generate_report(db: Session = Depends(get_db)):
    # Triggers GStack Weekly Report Skill
    result = gstack_service.execute_workflow(db, "Weekly Report Skill")
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message"))
        
    report = db.query(Report).filter(Report.report_id == result["report_id"]).first()
    return {
        "id": report.report_id,
        "type": "Weekly Governance Report",
        "dateRange": report.week,
        "healthScore": report.health_score,
        "summary": report.summary,
        "metrics": {
            "meetings": report.meetings_count,
            "decisions": report.decisions_count,
            "completedActions": report.completed_actions_count,
            "newRisks": report.new_risks_count
        }
    }

# ----------------- SKILLS -----------------

@router.get("/skills")
def get_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).all()
    
    # If empty, seed default skills
    if not skills:
        defaults = [
            Skill(name="Weekly Report Generator", version="v2.1.0", author="GStack Core", description="Automatically synthesizes all meeting data from the past 7 days into a comprehensive report for stakeholders.", color="from-blue-500 to-cyan-400", enabled=True),
            Skill(name="Risk Analyzer", version="v1.4.2", author="Hermes Team", description="Scans meeting transcripts to identify potential project blockers and automatically assigns them severity scores.", color="from-orange-500 to-red-400", enabled=True),
            Skill(name="Daily Action Tracker", version="v1.0.5", author="Community", description="Sends daily morning summaries of all open and overdue actions directly to Microsoft Teams channels.", color="from-purple-500 to-indigo-400", enabled=False),
            Skill(name="Jira Sync", version="v0.9.0-beta", author="GStack Labs", description="Automatically creates Jira tickets for newly identified actions and links them back to the governing meeting.", color="from-sky-400 to-blue-600", enabled=False),
            Skill(name="Meeting Summarizer", version="v3.0.0", author="Hermes Team", description="Generates quick summaries for every meeting over 30 minutes long.", color="from-emerald-400 to-teal-500", enabled=True)
        ]
        db.add_all(defaults)
        db.commit()
        skills = db.query(Skill).all()
        
    return [
        {
            "id": s.skill_id,
            "name": s.name,
            "description": s.description,
            "version": s.version,
            "author": s.author,
            "enabled": s.enabled,
            "color": s.color
        } for s in skills
    ]

@router.post("/skills/{skill_id}/toggle")
def toggle_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.skill_id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
        
    skill.enabled = not skill.enabled
    db.commit()
    db.refresh(skill)
    return {"id": skill.skill_id, "enabled": skill.enabled}

# ----------------- NATURAL LANGUAGE QUERY -----------------

@router.post("/query", response_model=QueryResponse)
def run_query(request: QueryRequest, db: Session = Depends(get_db)):
    # 1. Search the GBrain Knowledge Graph context
    graph_context = gbrain_service.query_graph(db, request.query)
    
    # 2. Synthesize markdown answer using Hermes Query Agent
    answer = hermes_service.synthesize_query_response(request.query, graph_context)
    
    return {"response": answer}

# ----------------- INTEGRATIONS SYNC -----------------

@router.post("/integrations/sync")
def sync_integration(request: dict, db: Session = Depends(get_db)):
    provider = request.get("provider")
    if provider == "teams-sync":
        meetings = teams_service.sync_meetings(db)
        return {
            "status": "success", 
            "message": f"Synced {len(meetings)} meetings from Teams.",
            "synced": [m.title for m in meetings]
        }
    elif provider == "outlook-sync":
        emails = outlook_service.sync_outlook(db)
        return {
            "status": "success", 
            "message": f"Synced {len(emails)} email threads from Outlook.",
            "synced": [e.title for e in emails]
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid provider specified")
