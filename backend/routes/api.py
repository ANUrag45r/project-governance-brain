from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import time
import json
import subprocess
from database import get_db
from models.meeting import Meeting
from models.action import Action
from models.risk import Risk
from models.decision import Decision
from schemas.meeting import MeetingUploadRequest

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat_with_hermes(request: ChatRequest):
    import re
    import subprocess
    
    # Fast Path: Look for explicit meeting IDs (e.g. "meeting 1005" or "meeting id 1005")
    match = re.search(r'(?i)meeting\s*(?:id\s*)?[-:]?\s*([a-fA-F0-9\-]+)', request.message)
    if match:
        meeting_id = match.group(1)
        from database import SessionLocal
        db = SessionLocal()
        try:
            m = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
            if m:
                decisions = db.query(Decision).filter(Decision.meeting_id == m.meeting_id).all()
                actions = db.query(Action).filter(Action.meeting_id == m.meeting_id).all()
                risks = db.query(Risk).filter(Risk.meeting_id == m.meeting_id).all()
                
                response = f"**Meeting Found:** {m.title}\n"
                response += f"**Summary:** {m.summary}\n\n"
                if decisions:
                    response += f"**Decisions ({len(decisions)}):**\n"
                    for d in decisions: response += f"- {d.description}\n"
                    response += "\n"
                if actions:
                    response += f"**Action Items ({len(actions)}):**\n"
                    for a in actions: response += f"- {a.task} (Owner: {a.owner}, Status: {a.status})\n"
                    response += "\n"
                if risks:
                    response += f"**Risks ({len(risks)}):**\n"
                    for r in risks: response += f"- {r.description} (Severity: {r.severity})\n"
                
                return {"response": response.strip() + "\n\n*(Instantly fetched via fast-path SQLite routing)*"}
            else:
                return {"response": f"I could not find any meeting with ID: {meeting_id}"}
        finally:
            db.close()
            
    # Slow Path: Call the real Hermes CLI
    try:
        # Note: This takes 30-45 seconds because the CLI has to boot, authenticate, and run the LLM
        result = subprocess.run(
            ["hermes", "-z", request.message], 
            capture_output=True, 
            text=True, 
            check=True,
            stdin=subprocess.DEVNULL
        )
        
        # Clean up the output string (remove the "Hermes" ASCII art and headers if they exist)
        out = result.stdout.strip()
        if "╭─ ⚕ Hermes ─" in out:
            # Extract everything after the header
            parts = out.split("╭─ ⚕ Hermes ─")
            if len(parts) > 1:
                out = parts[-1].split("╮\n")[-1].split("╰─")[0].strip()
                
        return {"response": out}
    except subprocess.CalledProcessError as e:
        return {"response": f"Error running Hermes CLI: {e.stderr}"}
    except Exception as e:
        return {"response": f"Internal error connecting to Hermes CLI: {str(e)}"}

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
            meeting_id=request.meeting_id,
            title=request.title,
            source="Manual Upload",
            summary="This is an AI-generated summary of the uploaded transcript. The meeting focused on key project deliverables and identified several operational risks.",
            transcript=request.transcript
        )
        try:
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
        except Exception as e:
            db.rollback()
            yield f"data: {json.dumps({'status': f'Database Error: {str(e)}'})}\n\n"

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
def get_meeting_detail(meeting_id: str, db: Session = Depends(get_db)):
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
