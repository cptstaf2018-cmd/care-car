from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.invoice import Invoice
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
    return q.order_by(Invoice.invoice_date.desc()).all()

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
