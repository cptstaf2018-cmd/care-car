from datetime import date, timedelta
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


def _net(invoice: Invoice) -> float:
    return float(invoice.amount) - float(invoice.discount or 0)


def get_sales_series(db: Session, tenant_id: int, period: str, year: int, month: int, today: date | None = None) -> dict:
    """Sales per day (weekly/monthly) or per month (yearly), from real invoices and services."""
    today = today or date.today()
    if period == "weekly":
        start, end = today - timedelta(days=6), today
        keys = [start + timedelta(days=i) for i in range(7)]
        bucket = lambda d: d  # noqa: E731
        label = lambda k: k.isoformat()  # noqa: E731
    elif period == "monthly":
        start, end = date(year, month, 1), date(year, month, monthrange(year, month)[1])
        keys = [start + timedelta(days=i) for i in range((end - start).days + 1)]
        bucket = lambda d: d  # noqa: E731
        label = lambda k: k.isoformat()  # noqa: E731
    else:  # yearly
        start, end = date(year, 1, 1), date(year, 12, 31)
        keys = [(year, m) for m in range(1, 13)]
        bucket = lambda d: (d.year, d.month)  # noqa: E731
        label = lambda k: f"{k[0]}-{k[1]:02d}"  # noqa: E731

    points = {k: {"date": label(k), "sales": 0.0, "paid": 0.0, "unpaid": 0.0, "services": 0} for k in keys}
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id, Invoice.invoice_date >= start, Invoice.invoice_date <= end
    ).all()
    for invoice in invoices:
        point = points[bucket(invoice.invoice_date)]
        net = _net(invoice)
        point["sales"] += net
        point["paid" if invoice.status == InvoiceStatus.paid else "unpaid"] += net
    services = db.query(Service.service_date).filter(
        Service.tenant_id == tenant_id, Service.service_date >= start, Service.service_date <= end
    ).all()
    for (service_date,) in services:
        points[bucket(service_date)]["services"] += 1
    return {"period": period, "points": list(points.values())}
