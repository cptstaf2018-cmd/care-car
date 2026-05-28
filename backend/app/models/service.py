from sqlalchemy import Column, Integer, String, ForeignKey, Date, Text
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
    employee_id = Column(Integer, ForeignKey("users.id"), index=True)
