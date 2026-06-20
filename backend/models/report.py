from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True, index=True)
    week = Column(String)
    summary = Column(Text)
    health_score = Column(Integer)
    meetings_count = Column(Integer)
    decisions_count = Column(Integer)
    completed_actions_count = Column(Integer)
    new_risks_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

