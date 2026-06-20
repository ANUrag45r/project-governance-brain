from pydantic import BaseModel

class MeetingUploadRequest(BaseModel):
    title: str
    transcript: str
