from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import time
import json
from database import get_db
from models.meeting import Meeting
from models.action import Action
from models.risk import Risk
from models.decision import Decision
from schemas.meeting import MeetingUploadRequest

router = APIRouter()

@router.post("/meetings/upload")
def upload_meeting(request: MeetingUploadRequest, db: Session = Depends(get_db)):
    def generate():
        # Step 1: Initialize
        yield f"data: {json.dumps({'status': 'Uploading transcript to GBrain...'})}\n\n"
        time.sleep(1.5)

        # Step 2: Simulate GBrain generating knowledge graph
        yield f"data: {json.dumps({'status': 'GBrain is generating the Knowledge Graph...'})}\n\n"
        time.sleep(2)

        # Step 3: Extracting items
        yield f"data: {json.dumps({'status': 'Extracting Decisions, Actions, and Risks...'})}\n\n"
        
        # Save to DB
        new_meeting = Meeting(
            title=request.title,
            source="Manual Upload",
            summary="This is an AI-generated summary of the uploaded transcript. The meeting focused on key project deliverables and identified several operational risks.",
            transcript=request.transcript
        )
        db.add(new_meeting)
        db.commit()
        db.refresh(new_meeting)

        # Add dummy relations to simulate extraction
        db.add(Decision(meeting_id=new_meeting.meeting_id, description="Proceed with new feature development"))
        db.add(Action(meeting_id=new_meeting.meeting_id, task="Review architecture", owner="Unassigned", status="Open"))
        db.add(Risk(meeting_id=new_meeting.meeting_id, description="Potential timeline slip", severity="Medium"))
        db.commit()

        time.sleep(1.5)

        # Step 4: Complete
        yield f"data: {json.dumps({'status': 'Complete', 'meeting_id': new_meeting.meeting_id})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.get("/meetings")
def get_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).all()
    # For MVP, we'll manually format the response to match the frontend expectations
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
            "participants": ["Alice", "Bob", "Charlie"], # Hardcoded for now
            "decisions": len(decisions),
            "actions": len(actions),
            "risks": len(risks)
        })
    return result

@router.get("/meetings/{meeting_id}")
def get_meeting_detail(meeting_id: int, db: Session = Depends(get_db)):
    m = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not m:
        return {"error": "Not found"}
        
    decisions = db.query(Decision).filter(Decision.meeting_id == m.meeting_id).all()
    actions = db.query(Action).filter(Action.meeting_id == m.meeting_id).all()
    risks = db.query(Risk).filter(Risk.meeting_id == m.meeting_id).all()
    
    return {
        "id": m.meeting_id,
        "title": m.title,
        "date": m.created_at.strftime("%b %d, %Y") if m.created_at else "Unknown",
        "summary": m.summary,
        "transcript": m.transcript,
        "participants": ["Alice", "Bob", "Charlie"],
        "decisions": [d.description for d in decisions],
        "actions": [{"task": a.task, "owner": a.owner, "status": a.status} for a in actions],
        "risks": [r.description for r in risks]
    }

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
            "meeting": m.title if m else "Unknown"
        })
    return result

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
            "status": "Active", # Simplified
            "detected": m.created_at.strftime("%b %d, %Y") if m and m.created_at else "Unknown",
            "meeting": m.title if m else "Unknown"
        })
    return result
