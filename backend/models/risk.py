from sqlalchemy import Column, Integer, String, Text, ForeignKey
from database import Base

class Risk(Base):
    __tablename__ = "risks"

    risk_id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, ForeignKey("meetings.meeting_id"))
    description = Column(Text)
    severity = Column(String)
