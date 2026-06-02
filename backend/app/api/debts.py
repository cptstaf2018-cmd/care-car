from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.car import Car
from app.models.debt import Debt
from app.models.invoice import Invoice
from app.models.message_log import MessageLog
from app.models.tenant import Tenant
from app.models.user import User, Role
from app.schemas.debt import DebtListOut, DebtOut, DebtReminderOut, DebtUpdate
from app.services.reminder_service import log_reminder_message, render_debt_reminder
from app.services.wasnder_service import send_whatsapp_message

router = APIRouter(prefix="/debts", tags=["debts"])

def _scope_debt_query(db: Session, user: User):
    q = db.query(Debt, Car, Invoice).join(Car, Debt.car_id == Car.id).join(Invoice, Debt.invoice_id == Invoice.id)
    if user.role != Role.superadmin:
        q = q.filter(Debt.tenant_id == user.tenant_id)
    return q


def _last_debt_message(db: Session, tenant_id: int, car_id: int):
    return db.query(MessageLog).filter(
        MessageLog.tenant_id == tenant_id,
        MessageLog.car_id == car_id,
        MessageLog.reminder_type == "debt_reminder",
    ).order_by(MessageLog.sent_at.desc(), MessageLog.id.desc()).first()


def _serialize_debt(db: Session, debt: Debt, car: Car, invoice: Invoice) -> DebtListOut:
    last = _last_debt_message(db, debt.tenant_id, debt.car_id)
    return DebtListOut(
        id=debt.id,
        tenant_id=debt.tenant_id,
        invoice_id=debt.invoice_id,
        car_id=debt.car_id,
        amount=float(debt.amount or 0),
        due_date=debt.due_date,
        notes=debt.notes,
        auto_reminder_enabled=debt.auto_reminder_enabled,
        customer_name=car.owner_name,
        phone=car.phone,
        plate_number=car.plate_number,
        car_type=car.car_type,
        invoice_date=invoice.invoice_date,
        invoice_amount=float(invoice.amount or 0),
        last_message_at=last.sent_at.isoformat() if last else None,
        last_message_status=last.status if last else None,
    )


@router.get("/", response_model=list[DebtListOut])
def list_debts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = _scope_debt_query(db, user).filter(Debt.amount > 0).order_by(Debt.created_at.desc()).all()
    return [_serialize_debt(db, debt, car, invoice) for debt, car, invoice in rows]

@router.patch("/{debt_id}", response_model=DebtOut)
def update_debt(debt_id: int, body: DebtUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    debt = db.get(Debt, debt_id)
    if not debt or debt.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(debt, k, v)
    db.commit()
    db.refresh(debt)
    return debt


@router.post("/{debt_id}/send-reminder", response_model=DebtReminderOut)
def send_debt_reminder_now(debt_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = _scope_debt_query(db, user).filter(Debt.id == debt_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    debt, car, _invoice = row
    tenant = db.get(Tenant, debt.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Center not found")
    if not car.phone:
        raise HTTPException(status_code=400, detail="لا يوجد رقم واتساب للزبون")

    message = render_debt_reminder(tenant, car, float(debt.amount or 0))
    status, response = send_whatsapp_message(tenant, car.phone, message)
    log_reminder_message(db, tenant, car, "debt_reminder", status, response, float(debt.amount or 0))
    return DebtReminderOut(status=status, message=message, provider_response=response)
