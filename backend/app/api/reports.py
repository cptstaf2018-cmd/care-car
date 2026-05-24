from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.report_service import get_daily_report, get_monthly_report

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/daily")
def daily_report(target_date: date = Query(default=None), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    d = target_date or date.today()
    return get_daily_report(db, user.tenant_id, d)

@router.get("/monthly")
def monthly_report(year: int = Query(default=None), month: int = Query(default=None),
                   db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    today = date.today()
    return get_monthly_report(db, user.tenant_id, year or today.year, month or today.month)
