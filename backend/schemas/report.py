from pydantic import BaseModel
from datetime import datetime

class ReportResponse(BaseModel):
    report_id: int
    week: str
    summary: str
    health_score: int
    meetings_count: int
    decisions_count: int
    completed_actions_count: int
    new_risks_count: int
    created_at: datetime

    class Config:
        from_attributes = True
