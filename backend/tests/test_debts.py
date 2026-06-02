from datetime import date

from app.core.security import hash_password
from app.models.car import Car
from app.models.debt import Debt
from app.models.invoice import Invoice
from app.models.message_log import MessageLog
from app.models.service import Service
from app.models.tenant import Tenant
from app.models.user import Role, User


def _setup_debt(db):
    tenant = Tenant(name="Debt Center", plan="basic")
    db.add(tenant)
    db.flush()
    user = User(tenant_id=tenant.id, email="debt@test.com", hashed_password=hash_password("pass"), role=Role.employee)
    car = Car(tenant_id=tenant.id, plate_number="D123", car_type="Kia", owner_name="احمد", phone="07700000000")
    db.add_all([user, car])
    db.flush()
    service = Service(tenant_id=tenant.id, car_id=car.id, service_date=date.today(), oil_type="15W40")
    db.add(service)
    db.flush()
    invoice = Invoice(tenant_id=tenant.id, service_id=service.id, amount=50000, status="unpaid", invoice_date=date.today())
    db.add(invoice)
    db.flush()
    debt = Debt(tenant_id=tenant.id, invoice_id=invoice.id, car_id=car.id, amount=35000)
    db.add(debt)
    db.commit()
    return tenant, user, car, debt


def _login(client):
    return client.post("/auth/login", json={"email": "debt@test.com", "password": "pass"}).json()["access_token"]


def test_list_debts_includes_customer_and_car_details(client, db):
    _tenant, _user, _car, debt = _setup_debt(db)
    token = _login(client)

    response = client.get("/debts/", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    row = response.json()[0]
    assert row["id"] == debt.id
    assert row["customer_name"] == "احمد"
    assert row["plate_number"] == "D123"
    assert row["auto_reminder_enabled"] is True


def test_send_debt_reminder_now_logs_attempt(client, db):
    _tenant, _user, _car, debt = _setup_debt(db)
    token = _login(client)

    response = client.post(f"/debts/{debt.id}/send-reminder", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["status"] == "not_configured"
    log = db.query(MessageLog).filter(MessageLog.reminder_type == "debt_reminder").first()
    assert log is not None
