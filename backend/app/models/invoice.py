import enum
from sqlalchemy import Column, Integer, ForeignKey, Numeric, Enum, Date
from app.models.base import Base, TimestampMixin

class InvoiceStatus(str, enum.Enum):
    paid = "paid"
    unpaid = "unpaid"
    partial = "partial"

class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    discount = Column(Numeric(12, 2), default=0)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.unpaid, nullable=False)
    invoice_date = Column(Date, nullable=False)
