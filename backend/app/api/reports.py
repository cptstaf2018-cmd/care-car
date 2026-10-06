from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.tenant import Tenant
from app.models.user import User, Role
from app.services.reminder_service import REMINDER_INTERVAL_DAYS, get_due_reminders
from app.services.report_service import get_daily_report, get_monthly_report, get_sales_series

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/daily")
def daily_report(target_date: date = Query(default=None), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == Role.superadmin:
        raise HTTPException(400, detail="Superadmin must specify tenant_id query parameter")
    d = target_date or date.today()
    return get_daily_report(db, user.tenant_id, d)

@router.get("/monthly")
def monthly_report(year: int = Query(default=None), month: int = Query(default=None),
                   db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == Role.superadmin:
        raise HTTPException(400, detail="Superadmin must specify tenant_id query parameter")
    today = date.today()
    return get_monthly_report(db, user.tenant_id, year or today.year, month or today.month)


@router.get("/maintenance-due")
def maintenance_due(limit: int = Query(default=8, ge=1, le=50),
                    db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Serviced cars ordered by how soon (or how overdue) their next oil change is."""
    if user.role == Role.superadmin:
        raise HTTPException(400, detail="Superadmin must specify tenant_id query parameter")
    tenant = db.get(Tenant, user.tenant_id)
    serviced = [r for r in get_due_reminders(db, tenant) if r["days_left"] is not None]
    serviced.sort(key=lambda r: r["days_left"])
    return {
        "interval_days": tenant.reminder_days or REMINDER_INTERVAL_DAYS,
        "cars": [{k: v for k, v in r.items() if k not in ("is_pre_due", "is_due_today")} for r in serviced[:limit]],
    }


@router.get("/series")
def sales_series(period: Literal["weekly", "monthly", "yearly"] = Query(default="monthly"),
                 year: int = Query(default=None, ge=2000, le=2100), month: int = Query(default=None, ge=1, le=12),
                 db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == Role.superadmin:
        raise HTTPException(400, detail="Superadmin must specify tenant_id query parameter")
    today = date.today()
    return get_sales_series(db, user.tenant_id, period, year or today.year, month or today.month, today)
