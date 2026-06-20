from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ActionCreate(BaseModel):
    task: str
    owner: str
    status: str = "Open"
    due_date: Optional[datetime] = None

class ActionUpdate(BaseModel):
    task: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None

class ActionResponse(BaseModel):
    action_id: int
    meeting_id: Optional[int] = None
    task: str
    owner: str
    status: str
    due_date: Optional[datetime] = None

    class Config:
        from_attributes = True
