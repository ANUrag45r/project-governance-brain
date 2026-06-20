from sqlalchemy.orm import Session
import datetime
import json
import logging
import httpx
from models.meeting import Meeting
from models.decision import Decision
from models.action import Action
from models.risk import Risk
from services.hermes_service import HermesService
from services.gbrain_service import GBrainService
from config import settings

logger = logging.getLogger("teams_service")

class TeamsService:
    def __init__(self):
        self.hermes = HermesService()
        self.gbrain = GBrainService()

    def sync_meetings(self, db: Session) -> list:
        """
        Syncs meeting transcripts from Microsoft Teams.
        If Gemini is enabled, dynamically generates a new, contextual follow-up meeting transcript.
        If Gemini is disabled, falls back to static mock meetings.
        """
        logger.info("Syncing MS Teams meetings...")
        synced_meetings = []

        # 1. Try Gemini Dynamic Transcript Generation
        if settings.GEMINI_API_KEY:
            try:
                # Gather existing context for continuity
                existing_decisions = db.query(Decision).limit(5).all()
                existing_actions = db.query(Action).filter(Action.status != "Done").limit(5).all()
                existing_risks = db.query(Risk).limit(5).all()

                context_str = ""
                if existing_decisions:
                    context_str += "Recent Decisions:\n" + "\n".join([f"- {d.description} (Owner: {d.owner})" for d in existing_decisions]) + "\n"
                if existing_actions:
                    context_str += "Open Action Items:\n" + "\n".join([f"- {a.task} (Owner: {a.owner}, Status: {a.status})" for a in existing_actions]) + "\n"
                if existing_risks:
                    context_str += "Active Risks:\n" + "\n".join([f"- {r.description} (Severity: {r.severity})" for r in existing_risks]) + "\n"

                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                prompt = f"""
You are simulating a Microsoft Teams meeting transcript generator.
Create a realistic transcript for a new project sync meeting. The discussion should naturally follow up on the current state of the project:
{context_str}

The transcript must:
1. Discuss progress on some of the open action items or mitigate active risks.
2. Make a new project decision, assign at least one new action item, and raise a new risk.
3. Be formatted as a dialogue between team members (Alice, Bob, Charlie, David).

Output a single JSON object with two fields:
- "title": A short, professional meeting title (e.g. "Sprint 13 Sync - Authentication follow-up").
- "transcript": The dialogue text transcript.

Ensure your response is valid JSON and strictly adheres to the schema below:
{{
  "title": "...",
  "transcript": "..."
}}
"""
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                }

                response = httpx.post(url, json=payload, timeout=30.0)
                if response.status_code == 200:
                    res_data = response.json()
                    text_response = res_data['candidates'][0]['content']['parts'][0]['text']
                    result = json.loads(text_response)
                    
                    title = result.get("title", f"Teams Sync - {datetime.datetime.now().strftime('%b %d')}")
                    transcript = result.get("transcript", "")
                    
                    if transcript:
                        # Parse generated transcript
                        extracted = self.hermes.analyze_meeting(title, transcript)
                        
                        meeting = Meeting(
                          title=title,
                          source="MS Teams",
                          summary=extracted["summary"],
                          transcript=transcript,
                          created_at=datetime.datetime.now()
                        )
                        db.add(meeting)
                        db.commit()
                        db.refresh(meeting)

                        # Save extracted details
                        for dec_data in extracted["decisions"]:
                            decision = Decision(
                                meeting_id=meeting.meeting_id,
                                description=dec_data["description"],
                                owner=dec_data["owner"]
                            )
                            db.add(decision)
                            db.commit()
                            db.refresh(decision)
                            self.gbrain.store_relation(db, "meeting", meeting.meeting_id, "decision", decision.decision_id, "MEETING_HAS_DECISION")

                        for act_data in extracted["actions"]:
                            action = Action(
                                meeting_id=meeting.meeting_id,
                                task=act_data["task"],
                                owner=act_data["owner"],
                                status=act_data["status"],
                                due_date=act_data["due_date"]
                            )
                            db.add(action)
                            db.commit()
                            db.refresh(action)
                            self.gbrain.store_relation(db, "action", action.action_id, "owner", 1, "ACTION_ASSIGNED_TO")

                        for risk_data in extracted["risks"]:
                            risk = Risk(
                                meeting_id=meeting.meeting_id,
                                description=risk_data["description"],
                                severity=risk_data["severity"]
                            )
                            db.add(risk)
                            db.commit()
                            db.refresh(risk)
                            self.gbrain.store_relation(db, "meeting", meeting.meeting_id, "risk", risk.risk_id, "MEETING_GENERATES_RISK")

                        synced_meetings.append(meeting)
                        logger.info(f"Dynamically generated and synced Teams meeting: {title}")
                        return synced_meetings
                else:
                    logger.error(f"Failed to generate Teams transcript: {response.text}")
            except Exception as e:
                logger.error(f"Dynamic Teams sync failed: {e}. Falling back to mock sync.")

        # 2. Mock Fallback Sync
        scenarios = [
            {
                "title": "Auth & Tenant Integration Sync",
                "transcript": (
                    "Alice: Welcome to the integration sync. We need to decide on database tenant isolation.\n"
                    "Charlie: I decided to build tenant middleware for database connections.\n"
                    "Bob: That works. I will setup the auth scaffolding by Oct 28.\n"
                    "David: The risk is that tenant databases are not fully synced, causing migration delays. This DB migration blocker is High severity.\n"
                ),
                "date": datetime.datetime.now() - datetime.timedelta(days=2)
            },
            {
                "title": "Weekly Sprint 13 Planning",
                "transcript": (
                    "Alice: Let's discuss Sprint 13 scheduling.\n"
                    "Charlie: I decided to write a background scheduler service on the backend using FastAPI.\n"
                    "Bob: I will handle frontend components for the reports page by Oct 29.\n"
                    "David: A major concern is scheduler cron triggers might clash with Redis locks, which is a Medium risk.\n"
                ),
                "date": datetime.datetime.now() - datetime.timedelta(days=1)
            }
        ]

        for sc in scenarios:
            existing = db.query(Meeting).filter(Meeting.title == sc["title"]).first()
            if existing:
                continue

            extracted = self.hermes.analyze_meeting(sc["title"], sc["transcript"])

            meeting = Meeting(
                title=sc["title"],
                source="MS Teams",
                summary=extracted["summary"],
                transcript=sc["transcript"],
                created_at=sc["date"]
            )
            db.add(meeting)
            db.commit()
            db.refresh(meeting)

            for dec_data in extracted["decisions"]:
                decision = Decision(
                    meeting_id=meeting.meeting_id,
                    description=dec_data["description"],
                    owner=dec_data["owner"]
                )
                db.add(decision)
                db.commit()
                db.refresh(decision)
                self.gbrain.store_relation(db, "meeting", meeting.meeting_id, "decision", decision.decision_id, "MEETING_HAS_DECISION")

            for act_data in extracted["actions"]:
                action = Action(
                    meeting_id=meeting.meeting_id,
                    task=act_data["task"],
                    owner=act_data["owner"],
                    status=act_data["status"],
                    due_date=act_data["due_date"]
                )
                db.add(action)
                db.commit()
                db.refresh(action)
                self.gbrain.store_relation(db, "action", action.action_id, "owner", 1, "ACTION_ASSIGNED_TO")

            for risk_data in extracted["risks"]:
                risk = Risk(
                    meeting_id=meeting.meeting_id,
                    description=risk_data["description"],
                    severity=risk_data["severity"]
                )
                db.add(risk)
                db.commit()
                db.refresh(risk)
                self.gbrain.store_relation(db, "meeting", meeting.meeting_id, "risk", risk.risk_id, "MEETING_GENERATES_RISK")

            synced_meetings.append(meeting)
            logger.info(f"Successfully synced fallback Teams meeting: {sc['title']}")

        return synced_meetings
