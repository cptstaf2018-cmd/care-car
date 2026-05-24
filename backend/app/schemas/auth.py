from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    tenant_id: int | None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str | None
    role: str
    tenant_id: int | None

    class Config:
        from_attributes = True
