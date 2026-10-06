from sqlalchemy import Column, Integer, String, ForeignKey, Text, UniqueConstraint
from app.models.base import Base, TimestampMixin

# A shop that sells parts over the counter has no car to attach the sale to, so each center gets
# one stand-in "walk-in" customer. It is hidden from car lists and never gets oil reminders.
WALKIN_PLATE = "بيع مباشر"
WALKIN_OWNER = "زبون عابر"


class Car(Base, TimestampMixin):
    __tablename__ = "cars"
    __table_args__ = (UniqueConstraint("tenant_id", "plate_number", name="uq_car_tenant_plate"),)
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    plate_number = Column(String(30), nullable=False)
    car_type = Column(String(50))
    car_color = Column(String(30))
    owner_name = Column(String(100))
    phone = Column(String(20))
    photo_url = Column(String(300))
    notes = Column(Text)
