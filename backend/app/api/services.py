from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, Role
from app.models.car import Car
from app.schemas.service import ServiceCreate
from app.services.pos_service import create_service_with_invoice
from app.models.debt import Debt

router = APIRouter(prefix="/services", tags=["services"])

@router.post("/", status_code=201)
def create_service(body: ServiceCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    car = db.get(Car, body.car_id)
    if not car or (user.role != Role.superadmin and car.tenant_id != user.tenant_id):
        raise HTTPException(status_code=404, detail="Car not found")
    svc, inv = create_service_with_invoice(db, car.tenant_id, body.model_dump())
    net = max(float(inv.amount or 0) - float(inv.discount or 0), 0)
    debt = db.query(Debt).filter(Debt.invoice_id == inv.id).first()
    remaining = min(float(debt.amount or 0), net) if debt else 0
    paid = max(net - remaining, 0)
    return {
        "service_id": svc.id,
        "invoice_id": inv.id,
        "amount": float(inv.amount),
        "status": inv.status,
        "paid_amount": paid,
        "remaining_amount": remaining,
    }
