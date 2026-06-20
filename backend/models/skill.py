from sqlalchemy import Column, Integer, String, Text
from database import Base

class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    version = Column(String)
    author = Column(String)
