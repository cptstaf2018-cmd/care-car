from pydantic import BaseModel, ConfigDict
from datetime import date
from app.models.invoice import InvoiceStatus
from app.schemas.service import ServiceInvoiceLine, InventoryDeduction

class InvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    service_id: int | None = None
    amount: float
    discount: float
    status: str
    invoice_date: date
    customer_name: str | None = None
    plate_number: str | None = None
    car_type: str | None = None
    service_name: str | None = None
    invoice_type: str = "service"
    paid_amount: float = 0
    remaining_amount: float = 0

class InvoiceUpdate(BaseModel):
    status: InvoiceStatus | None = None
    discount: float | None = None
    amount: float | None = None

class SaleCreate(BaseModel):
    customer_name: str | None = None
    customer_phone: str | None = None
    amount: float
    discount: float = 0.0
    payment_status: str | None = None
    paid_amount: float | None = None
    invoice_date: date | None = None
    invoice_lines: list[ServiceInvoiceLine] = []
    inventory_deductions: list[InventoryDeduction] = []
