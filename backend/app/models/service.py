from sqlalchemy import Column, Integer, String, ForeignKey, Date, Text, DateTime
from app.models.base import Base, TimestampMixin

class Service(Base, TimestampMixin):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=False, index=True)
    service_date = Column(Date, nullable=False)
    oil_type = Column(String(200), nullable=False)
    mileage = Column(Integer)
    notes = Column(Text)
    started_at = Column(DateTime, nullable=True)  # when the pit-stop timer began (UTC); null if no timer was used
    employee_id = Column(Integer, ForeignKey("users.id"), index=True)
