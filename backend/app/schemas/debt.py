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
    auto_reminder_enabled: bool = True

class DebtUpdate(BaseModel):
    amount: float | None = None
    notes: str | None = None
    auto_reminder_enabled: bool | None = None


class DebtListOut(DebtOut):
    customer_name: str | None = None
    phone: str | None = None
    plate_number: str | None = None
    car_type: str | None = None
    invoice_date: date | None = None
    invoice_amount: float | None = None
    last_message_at: str | None = None
    last_message_status: str | None = None


class DebtReminderOut(BaseModel):
    status: str
    message: str
    provider_response: str | None = None
