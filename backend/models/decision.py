from sqlalchemy import Column, Integer, String, Text, ForeignKey
from database import Base

class Decision(Base):
    __tablename__ = "decisions"

    decision_id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.meeting_id"))
    description = Column(Text)
    owner = Column(String)
