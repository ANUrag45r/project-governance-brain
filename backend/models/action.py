from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from database import Base

class Action(Base):
    __tablename__ = "actions"

    action_id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.meeting_id"))
    task = Column(Text)
    owner = Column(String)
    status = Column(String)
    due_date = Column(DateTime)
