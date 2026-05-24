from pydantic import BaseModel, ConfigDict
from datetime import date

class DebtOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    invoice_id: int
    car_id: int
    amount: float
    due_date: date | None
    notes: str | None

class DebtUpdate(BaseModel):
    amount: float | None = None
    notes: str | None = None
