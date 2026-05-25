from pydantic import BaseModel, ConfigDict

class InventoryCreate(BaseModel):
    oil_type: str
    category: str | None = None
    supplier_name: str | None = None
    quantity: float
    min_threshold: float = 10.0
    unit_cost: float | None = None
    sale_price: float | None = None

class InventoryUpdate(BaseModel):
    quantity: float | None = None
    min_threshold: float | None = None
    unit_cost: float | None = None
    sale_price: float | None = None
    category: str | None = None
    supplier_name: str | None = None
    total_sold: float | None = None

class InventoryReceiptLine(BaseModel):
    oil_type: str
    category: str | None = None
    quantity: float
    unit_cost: float | None = None
    sale_price: float | None = None
    min_threshold: float = 10.0

class InventoryReceiptCreate(BaseModel):
    supplier_name: str | None = None
    receipt_photo_url: str | None = None
    lines: list[InventoryReceiptLine]

class InventoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    oil_type: str
    category: str | None = None
    supplier_name: str | None = None
    quantity: float
    min_threshold: float
    unit_cost: float | None
    sale_price: float | None = None
    total_sold: float = 0
    low_stock: bool = False
