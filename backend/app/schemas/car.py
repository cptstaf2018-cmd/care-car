from pydantic import BaseModel, ConfigDict

class CarCreate(BaseModel):
    plate_number: str
    car_type: str | None = None
    car_color: str | None = None
    owner_name: str | None = None
    phone: str | None = None
    photo_url: str | None = None
    notes: str | None = None

class CarUpdate(BaseModel):
    car_type: str | None = None
    car_color: str | None = None
    owner_name: str | None = None
    phone: str | None = None
    photo_url: str | None = None
    notes: str | None = None

class CarOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    plate_number: str
    car_type: str | None
    car_color: str | None
    owner_name: str | None
    phone: str | None
    photo_url: str | None
    notes: str | None
