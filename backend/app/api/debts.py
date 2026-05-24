from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.debt import Debt
from app.models.user import User, Role
from app.schemas.debt import DebtOut, DebtUpdate

router = APIRouter(prefix="/debts", tags=["debts"])

@router.get("/", response_model=list[DebtOut])
def list_debts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Debt)
    if user.role != Role.superadmin:
        q = q.filter(Debt.tenant_id == user.tenant_id)
    return q.all()

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
