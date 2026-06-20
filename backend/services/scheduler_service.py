import asyncio
import datetime
from sqlalchemy.orm import sessionmaker
from models.action import Action
from services.teams_service import TeamsService
from services.outlook_service import OutlookService
import logging

logger = logging.getLogger("scheduler")

class SchedulerService:
    def __init__(self, session_factory: sessionmaker):
        self.session_factory = session_factory
        self.teams_service = TeamsService()
        self.outlook_service = OutlookService()
        self.is_running = False

    async def start(self):
        """Starts the background scheduler loop."""
        if self.is_running:
            return
        
        self.is_running = True
        logger.info("Starting background governance scheduler...")
        asyncio.create_task(self._loop())

    async def _loop(self):
        while self.is_running:
            try:
                # Run scheduler tick
                self.tick()
            except Exception as e:
                logger.error(f"Scheduler tick error: {e}")
            
            # Wait for 60 seconds (for demo purposes, checks frequently. In prod, this would be 1 hour)
            await asyncio.sleep(60)

    def stop(self):
        self.is_running = False
        logger.info("Stopping background governance scheduler...")

    def tick(self):
        """Runs the periodic scheduler operations."""
        db = self.session_factory()
        try:
            logger.info("Running periodic scheduler check...")
            
            # 1. Update Overdue Actions
            now = datetime.datetime.now()
            overdue_actions = db.query(Action).filter(
                Action.status != "Done",
                Action.status != "Overdue",
                Action.due_date < now
            ).all()
            
            if overdue_actions:
                for action in overdue_actions:
                    action.status = "Overdue"
                    logger.info(f"Task marked as OVERDUE: '{action.task}' assigned to {action.owner}")
                db.commit()
                
            # 2. Simulated Auto Ingestion (if configured in settings, we can simulate background syncs)
            # For simplicity, we just log status. Integrations sync is triggered manually via the Settings/Sync endpoints.
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error in scheduler tick: {e}")
        finally:
            db.close()
