from datetime import date, datetime, timedelta

from app.models.car import Car
from app.models.debt import Debt
from app.models.invoice import Invoice
from app.models.message_log import MessageLog
from app.models.service import Service
from app.models.tenant import Tenant
from app.services.reminder_service import get_cars_to_notify, render_debt_reminder


def _center_car_service(db, service_days_ago=20):
    tenant = Tenant(name=f"Center {service_days_ago}", plan="basic", reminder_days=20)
    db.add(tenant)
    db.flush()
    car = Car(
        tenant_id=tenant.id,
        plate_number=f"REM{service_days_ago}",
        car_type="Toyota",
        owner_name="سعد",
        phone="07700000000",
    )
    db.add(car)
    db.flush()
    service = Service(
        tenant_id=tenant.id,
        car_id=car.id,
        service_date=date.today() - timedelta(days=service_days_ago),
        oil_type="15W40",
    )
    db.add(service)
    db.commit()
    return tenant, car, service


def test_service_reminder_due_every_20_days(db):
    tenant, car, _ = _center_car_service(db, 20)

    reminders = get_cars_to_notify(db, tenant)

    assert any(r["car_id"] == car.id and r["reminder_type"] == "due_reminder" for r in reminders)


def test_service_reminder_not_repeated_before_20_days(db):
    tenant, car, _ = _center_car_service(db, 25)
    db.add(MessageLog(
        tenant_id=tenant.id,
        car_id=car.id,
        phone=car.phone,
        message="sent",
        reminder_type="due_reminder",
        status="sent",
        sent_at=datetime.now() - timedelta(days=19),
    ))
    db.commit()

    reminders = get_cars_to_notify(db, tenant)

    assert not any(r["car_id"] == car.id and r["reminder_type"] == "due_reminder" for r in reminders)


def test_debt_reminder_due_every_20_days_while_debt_open(db):
    tenant, car, service = _center_car_service(db, 1)
    invoice = Invoice(
        tenant_id=tenant.id,
        service_id=service.id,
        amount=50000,
        status="unpaid",
        invoice_date=date.today(),
    )
    db.add(invoice)
    db.flush()
    db.add(Debt(tenant_id=tenant.id, invoice_id=invoice.id, car_id=car.id, amount=35000))
    db.commit()

    reminders = get_cars_to_notify(db, tenant)
    message = render_debt_reminder(tenant, car, 35000)

    assert any(r["car_id"] == car.id and r["reminder_type"] == "debt_reminder" for r in reminders)
    assert "35,000 د.ع" in message
