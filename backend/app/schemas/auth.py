from pydantic import BaseModel, EmailStr, ConfigDict

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

    model_config = ConfigDict(from_attributes=True)
