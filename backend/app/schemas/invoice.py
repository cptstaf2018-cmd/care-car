from pydantic import BaseModel, ConfigDict
from datetime import date

class InvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    service_id: int
    amount: float
    discount: float
    status: str
    invoice_date: date

class InvoiceUpdate(BaseModel):
    status: str | None = None
    discount: float | None = None
