import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Boolean, CheckConstraint
from app.models.base import Base, TimestampMixin

class Role(str, enum.Enum):
    superadmin = "superadmin"
    manager = "manager"
    employee = "employee"

class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role = 'superadmin' OR tenant_id IS NOT NULL", name="user_tenant_required"),
    )
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    email = Column(String(120), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(Role), default=Role.employee, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
