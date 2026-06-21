import datetime
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models.meeting import Meeting
from models.decision import Decision
from models.action import Action
from models.risk import Risk

# Create tables
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    
    # Clean existing
    db.query(Risk).delete()
    db.query(Action).delete()
    db.query(Decision).delete()
    db.query(Meeting).delete()

    # Create Meetings
    m1 = Meeting(
        meeting_id="GBRAIN-1001",
        title="Sprint 12 Planning",
        source="MS Teams",
        summary="Discussed the upcoming features for the Sprint 12 release, focusing on the new authentication flow and database migrations.",
        transcript="Alice: Alright, let's look at Sprint 12. \nBob: I'll take the auth flow.\nCharlie: I'm handling the database migrations. We have a few tight deadlines but it looks manageable.",
        created_at=datetime.datetime(2026, 10, 24)
    )
    m2 = Meeting(
        meeting_id="GBRAIN-1002",
        title="Architecture Review",
        source="MS Teams",
        summary="Reviewed the proposed changes to the backend microservices architecture to improve scalability.",
        transcript="Alice: We need to split the monolithic API. \nDavid: If we use FastAPI for the new microservices, we can handle the load better.\nEve: Agreed, I'll start the scaffolding.",
        created_at=datetime.datetime(2026, 10, 22)
    )
    m3 = Meeting(
        meeting_id="GBRAIN-1003",
        title="Weekly Sync",
        source="MS Teams",
        summary="Standard weekly sync to discuss blockers and progress.",
        transcript="Bob: I'm blocked on the frontend deployment pipeline.\nCharlie: I can help you with the Docker compose file later today.\nDavid: Everything else is on track.",
        created_at=datetime.datetime(2026, 10, 20)
    )

    db.add_all([m1, m2, m3])
    db.commit()

    # Decisions
    d1 = Decision(meeting_id=m1.meeting_id, description="Use OAuth2 for authentication")
    d2 = Decision(meeting_id=m1.meeting_id, description="Proceed with PostgreSQL 15 migrations")
    d3 = Decision(meeting_id=m2.meeting_id, description="Adopt FastAPI for microservices")
    d4 = Decision(meeting_id=m2.meeting_id, description="Split monolithic API into 3 domains")
    d5 = Decision(meeting_id=m3.meeting_id, description="Pair programming session for Docker")

    db.add_all([d1, d2, d3, d4, d5])

    # Actions
    a1 = Action(meeting_id=m1.meeting_id, task="Setup Auth Scaffolding", owner="Bob", status="In Progress", due_date=datetime.datetime(2026, 10, 25))
    a2 = Action(meeting_id=m1.meeting_id, task="Draft schema migrations", owner="Charlie", status="Open", due_date=datetime.datetime(2026, 10, 26))
    a3 = Action(meeting_id=m2.meeting_id, task="Scaffold backend", owner="Eve", status="Done", due_date=datetime.datetime(2026, 10, 23))
    a4 = Action(meeting_id=m3.meeting_id, task="Fix frontend pipeline", owner="Bob", status="Overdue", due_date=datetime.datetime(2026, 10, 19))

    db.add_all([a1, a2, a3, a4])

    # Risks
    r1 = Risk(meeting_id=m1.meeting_id, description="Tight deadline for Auth module", severity="High")
    r2 = Risk(meeting_id=m2.meeting_id, description="Database Migration Risks", severity="Medium")
    r3 = Risk(meeting_id=m3.meeting_id, description="Frontend release might be delayed", severity="High")
    r4 = Risk(meeting_id=m3.meeting_id, description="Pipeline instability", severity="Medium")

    db.add_all([r1, r2, r3, r4])
    
    db.commit()
    print("Database seeded successfully with test data!")
    db.close()

if __name__ == "__main__":
    seed()
