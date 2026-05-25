from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from app.models.base import Base, TimestampMixin


class MessageLog(Base, TimestampMixin):
    __tablename__ = "message_logs"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=False, index=True)
    phone = Column(String(30), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="queued")
    provider = Column(String(50), nullable=False, default="wasnderapi")
    provider_response = Column(Text)
    sent_at = Column(DateTime, server_default=func.now(), nullable=False)
