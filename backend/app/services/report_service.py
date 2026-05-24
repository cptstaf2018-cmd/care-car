from datetime import date
from calendar import monthrange
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.invoice import Invoice, InvoiceStatus
from app.models.service import Service
from app.models.debt import Debt

def get_daily_report(db: Session, tenant_id: int, target_date: date) -> dict:
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.invoice_date == target_date
    ).all()
    total_sales = sum(float(i.amount) - float(i.discount or 0) for i in invoices)
    paid = sum(float(i.amount) - float(i.discount or 0) for i in invoices if i.status == InvoiceStatus.paid)
    service_count = db.query(Service).filter(
        Service.tenant_id == tenant_id,
        Service.service_date == target_date
    ).count()
    return {
        "date": str(target_date),
        "total_sales": total_sales,
        "paid": paid,
        "unpaid": total_sales - paid,
        "service_count": service_count,
        "invoice_count": len(invoices),
    }

def get_monthly_report(db: Session, tenant_id: int, year: int, month: int) -> dict:
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.invoice_date >= start,
        Invoice.invoice_date <= end,
    ).all()
    total_sales = sum(float(i.amount) - float(i.discount or 0) for i in invoices)
    paid = sum(float(i.amount) - float(i.discount or 0) for i in invoices if i.status == InvoiceStatus.paid)
    service_count = db.query(Service).filter(
        Service.tenant_id == tenant_id,
        Service.service_date >= start,
        Service.service_date <= end,
    ).count()
    pending_debts = db.query(func.sum(Debt.amount)).filter(Debt.tenant_id == tenant_id).scalar() or 0
    return {
        "year": year,
        "month": month,
        "total_sales": total_sales,
        "paid": paid,
        "unpaid": total_sales - paid,
        "service_count": service_count,
        "pending_debts": float(pending_debts),
    }
