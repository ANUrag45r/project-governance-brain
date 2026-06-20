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

logger = logging.getLogger("outlook_service")

class OutlookService:
    def __init__(self):
        self.hermes = HermesService()
        self.gbrain = GBrainService()

    def sync_outlook(self, db: Session) -> list:
        """
        Syncs emails and calendar invites from Microsoft Outlook.
        If Gemini is enabled, dynamically generates a new, contextual follow-up email thread.
        If Gemini is disabled, falls back to static mock email threads.
        """
        logger.info("Syncing Outlook events and emails...")
        synced_emails = []

        # 1. Try Gemini Dynamic Email Generation
        if settings.GEMINI_API_KEY:
            try:
                # Gather existing context
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
You are simulating a Microsoft Outlook email sync service.
Create a realistic email thread or meeting follow-up message. The email must naturally follow up on the current state of the project:
{context_str}

The email thread must:
1. Address some of the existing action items, milestones, or risks (e.g. status updates or blockers).
2. Propose or record a new decision, list a new action item, and describe a risk.
3. Be formatted like an email exchange (including Sender, Recipient, Subject, and email body paragraphs).

Output a single JSON object with two fields:
- "title": A subject line or descriptive title (e.g. "Email Thread: CI/CD Pipeline Migration blocker").
- "transcript": The formatted email thread text.

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
                    
                    title = result.get("title", f"Email Thread: Project Sync - {datetime.datetime.now().strftime('%b %d')}")
                    transcript = result.get("transcript", "")
                    
                    if transcript:
                        extracted = self.hermes.analyze_meeting(title, transcript)
                        
                        meeting = Meeting(
                          title=title,
                          source="Outlook Email",
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

                        synced_emails.append(meeting)
                        logger.info(f"Dynamically generated and synced Outlook email: {title}")
                        return synced_emails
                else:
                    logger.error(f"Failed to generate Outlook email thread: {response.text}")
            except Exception as e:
                logger.error(f"Dynamic Outlook sync failed: {e}. Falling back to mock sync.")

        # 2. Mock Fallback Sync
        emails = [
            {
                "title": "Email Thread: CI/CD Pipeline Migration blocker",
                "transcript": (
                    "Sender: Bob (Lead Engineer)\n"
                    "Recipient: Dev Team\n"
                    "Subject: CI/CD Pipeline Migration blocker\n\n"
                    "Hey Team, following up on our email discussion. We decided to use GitHub Actions for our primary pipelines.\n"
                    "I will configure the production deployment workflows by Oct 30.\n"
                    "The blocker is that self-hosted runners might have networking limitations, which is a Medium severity risk.\n"
                ),
                "date": datetime.datetime.now() - datetime.timedelta(days=3)
            }
        ]

        for em in emails:
            existing = db.query(Meeting).filter(Meeting.title == em["title"]).first()
            if existing:
                continue

            extracted = self.hermes.analyze_meeting(em["title"], em["transcript"])

            meeting = Meeting(
                title=em["title"],
                source="Outlook Email",
                summary=extracted["summary"],
                transcript=em["transcript"],
                created_at=em["date"]
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

            synced_emails.append(meeting)
            logger.info(f"Successfully synced fallback Outlook thread: {em['title']}")

        return synced_emails
