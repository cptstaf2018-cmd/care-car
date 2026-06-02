from pydantic import BaseModel, ConfigDict
from datetime import date

class InventoryDeduction(BaseModel):
    item_id: int
    quantity: float

class ServiceCreate(BaseModel):
    car_id: int
    oil_type: str
    amount: float
    discount: float = 0.0
    payment_status: str | None = None
    paid_amount: float | None = None
    mileage: int | None = None
    notes: str | None = None
    service_date: date | None = None
    inventory_deductions: list[InventoryDeduction] = []

class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    car_id: int
    oil_type: str
    mileage: int | None
    service_date: date
