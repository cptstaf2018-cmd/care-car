from pydantic import BaseModel, ConfigDict
from datetime import date

class InventoryDeduction(BaseModel):
    item_id: int
    quantity: float


class ServiceInvoiceLine(BaseModel):
    name: str
    amount: float
    quantity: float | None = 1
    unit_price: float | None = None
    notes: str | None = None
    inventory_item_id: int | None = None
    inventory_item_name: str | None = None
    inventory_quantity: float | None = None
    sku: str | None = None
    category: str | None = None

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
    invoice_lines: list[ServiceInvoiceLine] = []

class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    car_id: int
    oil_type: str
    mileage: int | None
    service_date: date
