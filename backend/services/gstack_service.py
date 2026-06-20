from sqlalchemy.orm import Session
import datetime
from models.meeting import Meeting
from models.decision import Decision
from models.action import Action
from models.risk import Risk
from models.report import Report
import logging

logger = logging.getLogger("gstack")

class GStackService:
    def execute_workflow(self, db: Session, workflow_name: str, parameters: dict = None) -> dict:
        """Executes a GStack workflow / skill."""
        logger.info(f"Executing GStack Workflow: {workflow_name}")
        
        if workflow_name == "Weekly Report Skill":
            return self.run_weekly_report_skill(db)
        elif workflow_name == "Sprint Health Analyzer Skill":
            return self.run_sprint_health_analyzer(db)
        else:
            return {"status": "success", "message": f"Workflow {workflow_name} executed (no side effects)."}

    def run_weekly_report_skill(self, db: Session) -> dict:
        """
        Gathers meetings, decisions, actions, and risks from the database.
        Computes the health score, generates a summary report, and stores it.
        """
        try:
            # Look back 7 days
            one_week_ago = datetime.datetime.now() - datetime.timedelta(days=7)
            
            # Query counts
            meetings = db.query(Meeting).filter(Meeting.created_at >= one_week_ago).all()
            meetings_count = len(meetings)
            
            # Since decisions/actions/risks are linked to meetings, let's get those that belong to the meetings or are active
            meeting_ids = [m.meeting_id for m in meetings]
            
            decisions_count = db.query(Decision).filter(Decision.meeting_id.in_(meeting_ids)).count() if meeting_ids else 0
            
            # Actions: count actions created in this period
            new_actions_count = db.query(Action).filter(Action.meeting_id.in_(meeting_ids)).count() if meeting_ids else 0
            completed_actions_count = db.query(Action).filter(Action.status == "Done").count()
            overdue_actions = db.query(Action).filter(Action.status == "Overdue").all()
            overdue_actions_count = len(overdue_actions)
            
            # Risks
            new_risks_count = db.query(Risk).filter(Risk.meeting_id.in_(meeting_ids)).count() if meeting_ids else 0
            high_risks = db.query(Risk).filter(Risk.severity == "High").all()
            medium_risks = db.query(Risk).filter(Risk.severity == "Medium").all()
            
            # Compute health score
            # Base 100, deduct for overdue items and active high-severity risks
            health_score = 100 - (overdue_actions_count * 8) - (len(high_risks) * 12) - (len(medium_risks) * 4)
            health_score = max(0, min(100, health_score))

            # Compile report summary
            week_num = datetime.datetime.now().strftime("%U")
            week_str = f"Week {week_num} ({datetime.datetime.now().strftime('%b %d')} - {(datetime.datetime.now() + datetime.timedelta(days=6)).strftime('%b %d, %Y')})"
            
            summary = (
                f"Project Governance Report for {week_str}.\n\n"
                f"During this period, the team held {meetings_count} meetings. "
                f"A total of {decisions_count} architectural and process decisions were recorded. "
                f"We tracked {completed_actions_count} completed actions, while {overdue_actions_count} actions are currently overdue. "
                f"{new_risks_count} new risks were identified.\n\n"
                f"Key Decisions: "
            )
            
            if meetings:
                meeting_decisions = db.query(Decision).filter(Decision.meeting_id.in_(meeting_ids)).all()
                if meeting_decisions:
                    summary += "; ".join([d.description for d in meeting_decisions[:3]])
                else:
                    summary += "No critical decisions recorded."
            else:
                summary += "No critical decisions recorded."
                
            if overdue_actions_count > 0:
                summary += f"\n\nAttention Required: The team has {overdue_actions_count} overdue action items. Address the pipeline blockers and auth timeline risks as soon as possible."
            else:
                summary += "\n\nAll sprint deliverables are currently tracking on schedule."

            # Save report to DB
            new_report = Report(
                week=week_str,
                summary=summary,
                health_score=health_score,
                meetings_count=meetings_count,
                decisions_count=decisions_count,
                completed_actions_count=completed_actions_count,
                new_risks_count=new_risks_count
            )
            db.add(new_report)
            db.commit()
            db.refresh(new_report)
            
            logger.info(f"Weekly Report generated: {new_report.report_id} - Health: {health_score}")
            return {
                "status": "success",
                "report_id": new_report.report_id,
                "health_score": health_score,
                "summary": summary
            }
        except Exception as e:
            db.rollback()
            logger.error(f"Error in Weekly Report skill execution: {e}")
            return {"status": "error", "message": str(e)}

    def run_sprint_health_analyzer(self, db: Session) -> dict:
        """Calculates current project governance health metrics."""
        overdue_count = db.query(Action).filter(Action.status == "Overdue").count()
        high_risks_count = db.query(Risk).filter(Risk.severity == "High").count()
        medium_risks_count = db.query(Risk).filter(Risk.severity == "Medium").count()
        
        health_score = 100 - (overdue_count * 8) - (high_risks_count * 12) - (medium_risks_count * 4)
        health_score = max(0, min(100, health_score))
        
        return {
            "health_score": health_score,
            "overdue_actions": overdue_count,
            "high_risks": high_risks_count,
            "medium_risks": medium_risks_count
        }
