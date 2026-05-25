from datetime import date, datetime
from pydantic import BaseModel


class ReminderOut(BaseModel):
    car_id: int
    plate_number: str
    owner_name: str | None
    phone: str | None
    photo_url: str | None
    last_service_date: date | None
    due_date: date | None
    days_left: int | None
    is_due: bool
    message: str


class MessageLogOut(BaseModel):
    id: int
    car_id: int
    phone: str
    message: str
    status: str
    provider: str
    sent_at: datetime

    class Config:
        from_attributes = True
