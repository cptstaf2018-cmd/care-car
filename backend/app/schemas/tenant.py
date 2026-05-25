from pydantic import BaseModel, ConfigDict
from datetime import date
from app.models.tenant import Plan

class TenantCreate(BaseModel):
    name: str
    plan: Plan = Plan.basic
    contact_phone: str | None = None
    logo_url: str | None = None
    subscription_starts_at: date | None = None
    subscription_ends_at: date | None = None
    subscription_notes: str | None = None
    ip_camera_url: str | None = None
    ip_camera_username: str | None = None
    ip_camera_password: str | None = None
    wasnder_api_key: str | None = None
    whatsapp_number: str | None = None
    reminder_days: int = 30
    reminder_message_template: str | None = None

class TenantUpdate(BaseModel):
    name: str | None = None
    plan: Plan | None = None
    is_active: bool | None = None
    contact_phone: str | None = None
    logo_url: str | None = None
    subscription_starts_at: date | None = None
    subscription_ends_at: date | None = None
    subscription_notes: str | None = None
    ip_camera_url: str | None = None
    ip_camera_username: str | None = None
    ip_camera_password: str | None = None
    wasnder_api_key: str | None = None
    whatsapp_number: str | None = None
    reminder_days: int | None = None
    reminder_message_template: str | None = None

class TenantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    plan: str
    is_active: bool
    contact_phone: str | None
    logo_url: str | None
    subscription_starts_at: date | None
    subscription_ends_at: date | None
    subscription_notes: str | None
    ip_camera_url: str | None
    ip_camera_username: str | None
    whatsapp_number: str | None
    reminder_days: int
    reminder_message_template: str | None
