from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.invoice import Invoice
from app.models.service import Service
from app.models.car import Car
from app.models.tenant import Tenant
from app.models.user import User, Role
from app.schemas.invoice import InvoiceOut, InvoiceUpdate

router = APIRouter(prefix="/invoices", tags=["invoices"])

@router.get("/", response_model=list[InvoiceOut])
def list_invoices(status: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Invoice)
    if user.role != Role.superadmin:
        q = q.filter(Invoice.tenant_id == user.tenant_id)
    if status:
        q = q.filter(Invoice.status == status)
    invoices = q.order_by(Invoice.invoice_date.desc()).all()
    result = []
    for inv in invoices:
      service = db.get(Service, inv.service_id)
      car = db.get(Car, service.car_id) if service else None
      total = float(inv.amount or 0) - float(inv.discount or 0)
      paid = total if inv.status == "paid" else 0
      result.append({
          "id": inv.id,
          "tenant_id": inv.tenant_id,
          "service_id": inv.service_id,
          "amount": float(inv.amount or 0),
          "discount": float(inv.discount or 0),
          "status": inv.status,
          "invoice_date": inv.invoice_date,
          "customer_name": car.owner_name if car else None,
          "plate_number": car.plate_number if car else None,
          "car_type": car.car_type if car else None,
          "service_name": service.oil_type if service else None,
          "paid_amount": paid,
          "remaining_amount": max(total - paid, 0),
      })
    return result

@router.get("/{invoice_id}/detail")
def get_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.get(Invoice, invoice_id)
    if not inv or (user.role != Role.superadmin and inv.tenant_id != user.tenant_id):
        raise HTTPException(status_code=404, detail="Invoice not found")
    service = db.get(Service, inv.service_id)
    car = db.get(Car, service.car_id) if service else None
    tenant = db.get(Tenant, inv.tenant_id)
    total = float(inv.amount or 0) - float(inv.discount or 0)
    paid = total if inv.status == "paid" else float(inv.paid_amount or 0) if hasattr(inv, 'paid_amount') else 0
    return {
        "id": inv.id,
        "invoice_date": str(inv.invoice_date),
        "status": inv.status,
        "amount": float(inv.amount or 0),
        "discount": float(inv.discount or 0),
        "net": total,
        "service_lines": (service.oil_type or "").split(" + ") if service else [],
        "notes": service.notes if service else None,
        "mileage": service.mileage if service else None,
        "customer_name": car.owner_name if car else None,
        "plate_number": car.plate_number if car else None,
        "car_type": car.car_type if car else None,
        "center_name": tenant.name if tenant else "",
        "center_phone": tenant.contact_phone if tenant else "",
        "center_logo": tenant.logo_url if tenant else "",
        "center_whatsapp": tenant.whatsapp_number if tenant else "",
    }

@router.patch("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(invoice_id: int, body: InvoiceUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.get(Invoice, invoice_id)
    if not inv or (user.role != Role.superadmin and inv.tenant_id != user.tenant_id):
        raise HTTPException(status_code=404, detail="Invoice not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(inv, k, v)
    db.commit()
    db.refresh(inv)
    return inv

@router.delete("/{invoice_id}", status_code=204)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.get(Invoice, invoice_id)
    if not inv or (user.role != Role.superadmin and inv.tenant_id != user.tenant_id):
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(inv)
    db.commit()
