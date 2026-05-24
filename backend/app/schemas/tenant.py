from pydantic import BaseModel, ConfigDict
from app.models.tenant import Plan

class TenantCreate(BaseModel):
    name: str
    plan: Plan = Plan.basic
    contact_phone: str | None = None

class TenantUpdate(BaseModel):
    name: str | None = None
    plan: Plan | None = None
    is_active: bool | None = None
    contact_phone: str | None = None

class TenantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    plan: str
    is_active: bool
    contact_phone: str | None
