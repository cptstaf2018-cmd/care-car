from app.models.tenant import Tenant
from app.models.user import User, Role
from app.models.car import Car
from app.models.invoice import Invoice, InvoiceStatus
from app.models.service import Service
from app.core.security import hash_password
from datetime import date


def login(client, email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]


def test_create_tenant_superadmin(client, db, superadmin, superadmin_token):
    payload = {
        "tenant": {"name": "New Garage", "plan": "basic"},
        "manager_email": "newmgr@garage.com",
        "manager_password": "securepass",
        "manager_name": "New Manager",
    }
    r = client.post(
        "/tenants/",
        json=payload,
        headers={"Authorization": f"Bearer {superadmin_token}"},
    )
    assert r.status_code == 201
    assert r.json()["name"] == "New Garage"


def test_create_tenant_unauthorized(client, db):
    t = Tenant(name="ExistingCtr", plan="basic")
    db.add(t)
    db.flush()
    u = User(tenant_id=t.id, email="emp@existing.com", hashed_password=hash_password("pass"), role=Role.employee)
    db.add(u)
    db.commit()

    token = login(client, "emp@existing.com", "pass")
    payload = {
        "tenant": {"name": "Sneaky Tenant", "plan": "basic"},
        "manager_email": "sneaky@mgr.com",
        "manager_password": "pass123",
    }
    r = client.post(
        "/tenants/",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


def test_list_tenants_includes_manager_and_registration_details(client, db, superadmin, superadmin_token):
    t = Tenant(name="Info Center", plan="basic", contact_phone="07700000001", whatsapp_number="07700000001")
    db.add(t)
    db.flush()
    u = User(
        tenant_id=t.id,
        email="07700000001@carecar.app",
        hashed_password=hash_password("pass"),
        role=Role.manager,
        full_name="Center Manager",
    )
    db.add(u)
    db.commit()

    r = client.get("/tenants/", headers={"Authorization": f"Bearer {superadmin_token}"})

    assert r.status_code == 200
    center = next(item for item in r.json() if item["name"] == "Info Center")
    assert center["manager_name"] == "Center Manager"
    assert center["manager_email"] is None
    assert center["manager_phone"] == "07700000001"
    assert center["registration_method"] == "whatsapp"
    assert center["registration_contact"] == "07700000001"


def test_monitoring_returns_center_health_and_activity(client, db, superadmin, superadmin_token):
    tenant = Tenant(name="Monitor Center", plan="pro", contact_phone="07710000000", whatsapp_number="07710000000")
    db.add(tenant)
    db.flush()
    manager = User(
        tenant_id=tenant.id,
        email="monitor@test.com",
        hashed_password=hash_password("pass"),
        role=Role.manager,
        full_name="Monitor Manager",
    )
    car = Car(tenant_id=tenant.id, plate_number="123ABC", owner_name="Ali", phone="07710000000")
    db.add_all([manager, car])
    db.flush()
    service = Service(tenant_id=tenant.id, car_id=car.id, service_date=date.today(), oil_type="5W30")
    db.add(service)
    db.flush()
    invoice = Invoice(
        tenant_id=tenant.id,
        service_id=service.id,
        amount=50000,
        discount=0,
        status=InvoiceStatus.paid,
        invoice_date=date.today(),
    )
    db.add(invoice)
    db.commit()

    r = client.get("/tenants/monitoring", headers={"Authorization": f"Bearer {superadmin_token}"})

    assert r.status_code == 200
    data = r.json()
    row = next(item for item in data["tenants"] if item["name"] == "Monitor Center")
    assert row["health"] == "warning"
    assert row["manager_name"] == "Monitor Manager"
    assert row["car_count"] == 1
    assert row["service_count"] == 1
    assert row["invoice_count"] == 1
    assert row["revenue_30_days"] == 50000.0
    assert "لا يوجد تاريخ انتهاء اشتراك" in row["issues"]


def test_suspended_tenant_blocks_login_and_existing_tokens(client, db, superadmin, superadmin_token):
    t = Tenant(name="SuspendedCtr", plan="basic")
    db.add(t)
    db.flush()
    u = User(tenant_id=t.id, email="mgr@suspended.com", hashed_password=hash_password("pass"), role=Role.manager)
    db.add(u)
    db.commit()

    manager_token = login(client, "mgr@suspended.com", "pass")

    r = client.patch(
        f"/tenants/{t.id}",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {superadmin_token}"},
    )
    assert r.status_code == 200
    assert r.json()["is_active"] is False

    login_after_suspend = client.post("/auth/login", json={"email": "mgr@suspended.com", "password": "pass"})
    assert login_after_suspend.status_code == 403
    assert login_after_suspend.json()["detail"] == "Account suspended"

    old_token_request = client.get("/auth/me", headers={"Authorization": f"Bearer {manager_token}"})
    assert old_token_request.status_code == 403
    assert old_token_request.json()["detail"] == "Account suspended"
