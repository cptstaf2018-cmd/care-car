from pydantic import BaseModel, ConfigDict

class InventoryCreate(BaseModel):
    oil_type: str
    quantity: float
    min_threshold: float = 10.0
    unit_cost: float | None = None

class InventoryUpdate(BaseModel):
    quantity: float | None = None
    min_threshold: float | None = None
    unit_cost: float | None = None

class InventoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    oil_type: str
    quantity: float
    min_threshold: float
    unit_cost: float | None
    low_stock: bool = False
