import enum
from sqlalchemy import Column, Integer, String, Enum, Boolean
from app.models.base import Base, TimestampMixin

class Plan(str, enum.Enum):
    basic = "basic"
    pro = "pro"
    enterprise = "enterprise"

class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    plan = Column(Enum(Plan), default=Plan.basic, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    contact_phone = Column(String(20))
