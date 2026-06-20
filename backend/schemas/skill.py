from pydantic import BaseModel

class SkillResponse(BaseModel):
    skill_id: int
    name: str
    version: str
    author: str
    description: str
    color: str
    enabled: bool

    class Config:
        from_attributes = True
