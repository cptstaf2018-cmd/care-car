from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, Role
from app.models.car import Car
from app.schemas.service import ServiceCreate
from app.services.pos_service import create_service_with_invoice

router = APIRouter(prefix="/services", tags=["services"])

@router.post("/", status_code=201)
def create_service(body: ServiceCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    car = db.get(Car, body.car_id)
    if not car or (user.role != Role.superadmin and car.tenant_id != user.tenant_id):
        raise HTTPException(status_code=404, detail="Car not found")
    svc, inv = create_service_with_invoice(db, car.tenant_id, body.model_dump())
    return {"service_id": svc.id, "invoice_id": inv.id, "amount": float(inv.amount), "status": inv.status}
