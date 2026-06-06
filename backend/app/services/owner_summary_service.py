from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.debt import Debt
from app.models.inventory import InventoryItem
from app.models.invoice import Invoice
from app.models.service import Service
from app.models.tenant import Tenant


def _money(value) -> float:
    return float(value or 0)


def build_owner_daily_summary(db: Session, tenant: Tenant, today: date | None = None, force: bool = False) -> str | None:
    """End-of-day summary for the center owner. Returns None when there is nothing
    worth sending (no activity, no debts, no low stock) unless force=True."""
    today = today or date.today()

    revenue = db.query(
        func.coalesce(func.sum(Invoice.amount - func.coalesce(Invoice.discount, 0)), 0)
    ).filter(Invoice.tenant_id == tenant.id, Invoice.invoice_date == today).scalar()

    invoice_count = db.query(func.count(Invoice.id)).filter(
        Invoice.tenant_id == tenant.id, Invoice.invoice_date == today
    ).scalar() or 0

    service_count = db.query(func.count(Service.id)).filter(
        Service.tenant_id == tenant.id, Service.service_date == today
    ).scalar() or 0

    debt_total = db.query(func.coalesce(func.sum(Debt.amount), 0)).filter(
        Debt.tenant_id == tenant.id, Debt.amount > 0
    ).scalar()

    low_items = db.query(InventoryItem).filter(
        InventoryItem.tenant_id == tenant.id,
        InventoryItem.quantity <= InventoryItem.min_threshold,
    ).all()

    has_activity = bool(invoice_count or service_count or _money(revenue) or _money(debt_total) or low_items)
    if not has_activity and not force:
        return None

    parts = [
        f"ملخص يومك في {tenant.name} 📊",
        f"التاريخ: {today}",
        "———",
        f"💰 مبيعات اليوم: {_money(revenue):,.0f} د.ع",
        f"🧾 عدد الفواتير: {invoice_count}",
        f"🚗 خدمات اليوم: {service_count}",
        "———",
        f"📌 ديون غير محصّلة: {_money(debt_total):,.0f} د.ع",
    ]

    if low_items:
        names = "، ".join(item.oil_type for item in low_items[:3] if item.oil_type)
        suffix = f" ({names}…)" if len(low_items) > 3 else (f" ({names})" if names else "")
        parts.append(f"⚠️ مخزون منخفض: {len(low_items)} صنف{suffix}")
    else:
        parts.append("✅ لا توجد مواد منخفضة ضمن المخزون المسجل")

    parts.append("———")
    parts.append("Care Car")
    return "\n".join(parts)
