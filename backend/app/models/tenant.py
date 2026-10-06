import enum
from sqlalchemy import Column, Integer, String, Enum, Boolean, Date, DateTime
from app.models.base import Base, TimestampMixin

class Plan(str, enum.Enum):
    basic = "basic"
    pro = "pro"
    enterprise = "enterprise"

class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    specialty = Column(String(40), default="quick_service", nullable=False)
    plan = Column(Enum(Plan), default=Plan.basic, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    contact_phone = Column(String(20))
    logo_url = Column(String(500))
    subscription_starts_at = Column(Date)
    subscription_ends_at = Column(Date)
    subscription_notes = Column(String(500))
    ip_camera_url = Column(String(500))
    ip_camera_username = Column(String(100))
    ip_camera_password = Column(String(200))
    wasnder_api_key = Column(String(300))
    whatsapp_number = Column(String(30))
    reminder_days = Column(Integer, default=20, nullable=False)
    reminder_message_template = Column(String(1000))
    debt_message_template = Column(String(1000))
    trial_ends_at = Column(DateTime, nullable=True)
    subscription_request_plan = Column(String(20), nullable=True)
    subscription_request_ref = Column(String(100), nullable=True)
