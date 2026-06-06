from datetime import date

from app.models.tenant import Tenant
from app.services.pos_service import create_sale_invoice
from app.services.owner_summary_service import build_owner_daily_summary


def _tenant(db, name="SummaryCtr"):
    t = Tenant(name=name, plan="basic", specialty="multi_service")
    db.add(t)
    db.commit()
    return t


def test_summary_is_none_when_no_activity(db):
    t = _tenant(db, "QuietCenter")
    assert build_owner_daily_summary(db, t) is None


def test_summary_force_returns_message_even_when_empty(db):
    t = _tenant(db, "ForcedCenter")
    msg = build_owner_daily_summary(db, t, force=True)
    assert msg is not None
    assert "ملخص يومك" in msg
    assert "مبيعات اليوم" in msg


def test_summary_reflects_today_sales(db):
    t = _tenant(db, "BusyCenter")
    create_sale_invoice(db, t.id, {
        "customer_name": "زبون",
        "customer_phone": "07700000000",
        "amount": 80000,
        "payment_status": "paid",
        "invoice_date": date.today(),
        "invoice_lines": [{"name": "فلتر", "amount": 80000, "quantity": 1, "unit_price": 80000}],
    })

    msg = build_owner_daily_summary(db, t)

    assert msg is not None
    assert "80,000 د.ع" in msg
    assert "عدد الفواتير: 1" in msg
