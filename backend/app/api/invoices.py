from fastapi import APIRouter, Depends, HTTPException
import os
import json
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.invoice import Invoice, InvoiceStatus
from app.models.service import Service
from app.models.car import Car
from app.models.tenant import Tenant
from app.models.user import User, Role
from app.models.debt import Debt
from app.schemas.invoice import InvoiceOut, InvoiceUpdate

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _logo_url(tenant: Tenant | None) -> str:
    if not tenant or not tenant.logo_url:
        return ""
    if tenant.logo_url.startswith("/uploads/logos/") and os.path.exists(os.path.join("/app", tenant.logo_url.lstrip("/"))):
        return tenant.logo_url
    return ""


def _invoice_amounts(db: Session, inv: Invoice) -> tuple[float, float, float]:
    total = max(float(inv.amount or 0) - float(inv.discount or 0), 0)
    debt = db.query(Debt).filter(Debt.invoice_id == inv.id).first()
    remaining = min(float(debt.amount or 0), total) if debt else (0 if inv.status == InvoiceStatus.paid else total)
    paid = max(total - remaining, 0)
    return total, paid, remaining


def _invoice_lines(service: Service | None) -> list[dict]:
    if not service:
        return []
    notes = service.notes or ""
    if notes.startswith("INVOICE_LINES:"):
        try:
            data = json.loads(notes.removeprefix("INVOICE_LINES:"))
            if isinstance(data, list):
                return [
                    {
                        "name": str(line.get("name") or ""),
                        "amount": float(line.get("amount") or 0),
                        "notes": str(line.get("notes") or ""),
                        "inventory_item_name": str(line.get("inventory_item_name") or ""),
                        "inventory_quantity": line.get("inventory_quantity"),
                    }
                    for line in data
                    if isinstance(line, dict) and (line.get("name") or line.get("inventory_item_name"))
                ]
        except (TypeError, ValueError, json.JSONDecodeError):
            pass
    return [
        {
            "name": line,
            "amount": 0,
            "notes": "",
            "inventory_item_name": "",
            "inventory_quantity": None,
        }
        for line in (service.oil_type or "").split(" + ")
        if line
    ]


def _sync_invoice_debt(db: Session, inv: Invoice):
    service = db.get(Service, inv.service_id)
    if not service:
        return
    total = max(float(inv.amount or 0) - float(inv.discount or 0), 0)
    debt = db.query(Debt).filter(Debt.invoice_id == inv.id).first()
    if inv.status == InvoiceStatus.paid or total <= 0:
        if debt:
            db.delete(debt)
        return
    remaining = total
    if debt:
        debt.amount = remaining
    else:
        db.add(Debt(
            tenant_id=inv.tenant_id,
            invoice_id=inv.id,
            car_id=service.car_id,
            amount=remaining,
            notes="دين من تعديل حالة الفاتورة",
        ))

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
      total, paid, remaining = _invoice_amounts(db, inv)
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
          "remaining_amount": remaining,
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
    total, paid, remaining = _invoice_amounts(db, inv)
    invoice_lines = _invoice_lines(service)
    return {
        "id": inv.id,
        "invoice_date": str(inv.invoice_date),
        "status": inv.status,
        "amount": float(inv.amount or 0),
        "discount": float(inv.discount or 0),
        "net": total,
        "paid_amount": paid,
        "remaining_amount": remaining,
        "service_lines": [line["name"] for line in invoice_lines],
        "invoice_lines": invoice_lines,
        "notes": "" if service and (service.notes or "").startswith("INVOICE_LINES:") else (service.notes if service else None),
        "mileage": service.mileage if service else None,
        "customer_name": car.owner_name if car else None,
        "plate_number": car.plate_number if car else None,
        "car_type": car.car_type if car else None,
        "center_name": tenant.name if tenant else "",
        "center_phone": tenant.contact_phone if tenant else "",
        "center_logo": _logo_url(tenant),
        "center_whatsapp": tenant.whatsapp_number if tenant else "",
    }

@router.patch("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(invoice_id: int, body: InvoiceUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.get(Invoice, invoice_id)
    if not inv or (user.role != Role.superadmin and inv.tenant_id != user.tenant_id):
        raise HTTPException(status_code=404, detail="Invoice not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(inv, k, v)
    _sync_invoice_debt(db, inv)
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
