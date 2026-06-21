from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    source = Column(String)
    transcript = Column(Text)
    summary = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
