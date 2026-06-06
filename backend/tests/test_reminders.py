from datetime import date

from app.models.tenant import Tenant
from app.models.user import User, Role
from app.core.security import hash_password
from app.services.pos_service import create_sale_invoice
from app.services.reminder_service import get_debt_reminders, log_reminder_message, render_sale_debt_reminder


def test_sale_debt_reminder_without_car_is_returned_once_per_interval(db):
    tenant = Tenant(
        name="Parts Reminder",
        plan="basic",
        specialty="multi_service",
        wasnder_api_key="key",
        whatsapp_number="07700000000",
        contact_phone="07700000000",
    )
    db.add(tenant)
    db.flush()
    db.add(User(tenant_id=tenant.id, email="parts-rem@test.com", hashed_password=hash_password("pass"), role=Role.manager))
    db.commit()

    invoice = create_sale_invoice(db, tenant.id, {
        "customer_name": "سعد",
        "customer_phone": "07706688044",
        "amount": 25000,
        "payment_status": "unpaid",
        "invoice_date": date.today(),
        "invoice_lines": [{"name": "فلتر زيت", "amount": 25000, "quantity": 1, "unit_price": 25000}],
    })

    reminders = get_debt_reminders(db, tenant)

    sale_reminder = next(item for item in reminders if item["debt_id"])
    assert sale_reminder["car"] is None
    assert sale_reminder["phone"] == "07706688044"
    assert sale_reminder["customer_name"] == "سعد"
    assert sale_reminder["debt_amount"] == 25000

    log_reminder_message(
        db,
        tenant,
        None,
        "debt_reminder",
        "sent",
        "ok",
        25000,
        debt_id=sale_reminder["debt_id"],
        phone=sale_reminder["phone"],
        customer_name=sale_reminder["customer_name"],
    )

    assert get_debt_reminders(db, tenant) == []
    assert render_sale_debt_reminder(tenant, invoice.customer_name, 25000).startswith("أهلاً أستاذ سعد")
