from sqlalchemy import Column, Integer, String, Text, Boolean
from database import Base

class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    version = Column(String)
    author = Column(String)
    description = Column(Text)
    color = Column(String)
    enabled = Column(Boolean, default=True)

