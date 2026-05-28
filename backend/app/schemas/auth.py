from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Literal


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


class RegisterRequest(BaseModel):
    center_name: str
    full_name: str
    contact_method: Literal["whatsapp", "email"] = "whatsapp"
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None


class RegisterResponse(BaseModel):
    message: str
