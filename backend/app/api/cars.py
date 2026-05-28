from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.car import Car
from app.models.user import User, Role
from app.schemas.car import CarCreate, CarUpdate, CarOut

router = APIRouter(prefix="/cars", tags=["cars"])

def resolve_tenant(user: User, tenant_id_param: int | None = None) -> int:
    if user.role == Role.superadmin:
        if not tenant_id_param:
            raise HTTPException(status_code=400, detail="tenant_id required for superadmin")
        return tenant_id_param
    return user.tenant_id

@router.get("/", response_model=list[CarOut])
def list_cars(tenant_id: int | None = None, search: str | None = None,
              db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tid = resolve_tenant(user, tenant_id)
    q = db.query(Car).filter(Car.tenant_id == tid)
    if search:
        q = q.filter(Car.plate_number.ilike(f"%{search}%"))
    return q.all()

@router.post("/", response_model=CarOut, status_code=201)
def create_car(body: CarCreate, tenant_id: int | None = None,
               db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tid = resolve_tenant(user, tenant_id)
    existing = db.query(Car).filter(Car.tenant_id == tid, Car.plate_number == body.plate_number).first()
    if existing:
        raise HTTPException(status_code=409, detail="Plate already registered")
    car = Car(tenant_id=tid, **body.model_dump())
    db.add(car)
    db.commit()
    db.refresh(car)
    return car

@router.get("/{car_id}", response_model=CarOut)
def get_car(car_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    car = db.get(Car, car_id)
    if not car or (user.role != Role.superadmin and car.tenant_id != user.tenant_id):
        raise HTTPException(status_code=404, detail="Car not found")
    return car

@router.patch("/{car_id}", response_model=CarOut)
def update_car(car_id: int, body: CarUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    car = db.get(Car, car_id)
    if not car or (user.role != Role.superadmin and car.tenant_id != user.tenant_id):
        raise HTTPException(status_code=404, detail="Car not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(car, k, v)
    db.commit()
    db.refresh(car)
    return car

@router.delete("/{car_id}", status_code=204)
def delete_car(car_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    car = db.get(Car, car_id)
    if not car or (user.role != Role.superadmin and car.tenant_id != user.tenant_id):
        raise HTTPException(status_code=404, detail="Car not found")
    try:
        db.delete(car)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="لا يمكن حذف السيارة لوجود خدمات مرتبطة بها")
