from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from app.models.base import Base, TimestampMixin


class InvoiceLine(Base, TimestampMixin):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory.id"), nullable=True, index=True)
    name = Column(String(200), nullable=False)
    sku = Column(String(80), nullable=True)
    category = Column(String(80), nullable=True)
    quantity = Column(Numeric(10, 2), nullable=False, server_default="1")
    unit_price = Column(Numeric(12, 2), nullable=False, server_default="0")
    line_total = Column(Numeric(12, 2), nullable=False, server_default="0")
    notes = Column(String(300), nullable=True)
