from sqlalchemy import Column, Integer, String, Text
from database import Base

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True, index=True)
    week = Column(String)
    summary = Column(Text)
