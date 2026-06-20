from pydantic import BaseModel
from typing import List, Dict, Any

class ActivityLog(BaseModel):
    id: int
    type: str
    title: str
    subtitle: str
    time: str

class TrendPoint(BaseModel):
    month: str
    meetings: int

class DashboardResponse(BaseModel):
    total_meetings: int
    total_decisions: int
    open_actions: int
    risks_count: int
    health_score: int
    recent_activities: List[ActivityLog]
    trends: List[TrendPoint]
