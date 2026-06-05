from sqlalchemy import Boolean, Column, Integer, ForeignKey, Numeric, Date, String
from app.models.base import Base, TimestampMixin

class Debt(Base, TimestampMixin):
    __tablename__ = "debts"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=True, index=True)
    customer_name = Column(String(120))
    customer_phone = Column(String(40))
    amount = Column(Numeric(12, 2), nullable=False)
    due_date = Column(Date)
    notes = Column(String(300))
    auto_reminder_enabled = Column(Boolean, default=True, nullable=False)
