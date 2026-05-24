from sqlalchemy import Column, Integer, String, ForeignKey, Text
from app.models.base import Base, TimestampMixin

class Car(Base, TimestampMixin):
    __tablename__ = "cars"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    plate_number = Column(String(30), nullable=False)
    car_type = Column(String(50))
    owner_name = Column(String(100))
    phone = Column(String(20))
    photo_url = Column(String(300))
    notes = Column(Text)
