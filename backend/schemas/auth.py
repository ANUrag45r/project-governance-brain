from pydantic import BaseModel

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    email: str

class UserProfileResponse(BaseModel):
    user_id: int
    name: str
    email: str
    tenant_id: str
    role: str
