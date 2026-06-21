from pydantic import BaseModel

class MeetingUploadRequest(BaseModel):
    meeting_id: str
    title: str
    transcript: str
