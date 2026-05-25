from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from app.models.base import Base, TimestampMixin

class InventoryItem(Base, TimestampMixin):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    oil_type = Column(String(120), nullable=False)
    category = Column(String(80))
    supplier_name = Column(String(160))
    quantity = Column(Numeric(10, 2), nullable=False, server_default="0")
    min_threshold = Column(Numeric(10, 2), server_default="10", nullable=False)
    unit_cost = Column(Numeric(12, 2))
    sale_price = Column(Numeric(12, 2))
    total_sold = Column(Numeric(10, 2), nullable=False, server_default="0")
