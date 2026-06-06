from app.models.tenant import Tenant
from app.models.user import User, Role
from app.models.car import Car
from app.models.debt import Debt
from app.models.invoice_line import InvoiceLine
from app.core.security import hash_password


def setup_tenant_with_car(db, email="inv_emp@test.com", tenant_name="InvCtr", plate="INV001"):
    t = Tenant(name=tenant_name, plan="basic")
    db.add(t)
    db.flush()
    u = User(tenant_id=t.id, email=email, hashed_password=hash_password("pass"), role=Role.employee)
    car = Car(tenant_id=t.id, plate_number=plate)
    db.add_all([u, car])
    db.commit()
    return t, u, car


def login(client, email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]


def create_service(client, car_id, token):
    r = client.post(
        "/services/",
        json={"car_id": car_id, "oil_type": "15W40", "amount": 50000},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    return r.json()


def test_mark_invoice_paid(client, db):
    _, _, car = setup_tenant_with_car(db)
    token = login(client, "inv_emp@test.com", "pass")
    svc = create_service(client, car.id, token)
    invoice_id = svc["invoice_id"]

    r = client.patch(
        f"/invoices/{invoice_id}",
        json={"status": "paid"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "paid"


def test_mark_invoice_invalid_status(client, db):
    _, _, car = setup_tenant_with_car(db)
    token = login(client, "inv_emp@test.com", "pass")
    svc = create_service(client, car.id, token)
    invoice_id = svc["invoice_id"]

    r = client.patch(
        f"/invoices/{invoice_id}",
        json={"status": "hacked"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 422


def test_cross_tenant_invoice_isolation(client, db):
    # Tenant A
    t_a = Tenant(name="TenantA", plan="basic")
    t_b = Tenant(name="TenantB", plan="basic")
    db.add_all([t_a, t_b])
    db.flush()

    u_a = User(tenant_id=t_a.id, email="a@test.com", hashed_password=hash_password("pass"), role=Role.employee)
    u_b = User(tenant_id=t_b.id, email="b@test.com", hashed_password=hash_password("pass"), role=Role.employee)
    car_a = Car(tenant_id=t_a.id, plate_number="PLATEA")
    db.add_all([u_a, u_b, car_a])
    db.commit()

    token_a = login(client, "a@test.com", "pass")
    token_b = login(client, "b@test.com", "pass")

    svc = create_service(client, car_a.id, token_a)
    invoice_id = svc["invoice_id"]

    # Tenant B tries to mark tenant A's invoice as paid
    r = client.patch(
        f"/invoices/{invoice_id}",
        json={"status": "paid"},
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert r.status_code == 404


def test_list_invoices(client, db):
    _, _, car = setup_tenant_with_car(db)
    token = login(client, "inv_emp@test.com", "pass")
    svc = create_service(client, car.id, token)
    invoice_id = svc["invoice_id"]

    r = client.get("/invoices/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    ids = [inv["id"] for inv in r.json()]
    assert invoice_id in ids


def test_delete_invoice_removes_debt_and_lines(client, db):
    _, _, car = setup_tenant_with_car(db, email="delete-inv@test.com", tenant_name="DeleteInvoiceCtr", plate="DEL001")
    token = login(client, "delete-inv@test.com", "pass")
    r = client.post(
        "/services/",
        json={
            "car_id": car.id,
            "oil_type": "زيت محرك",
            "amount": 100,
            "payment_status": "unpaid",
            "invoice_lines": [{"name": "زيت محرك", "amount": 100, "quantity": 1, "unit_price": 100}],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    invoice_id = r.json()["invoice_id"]
    assert db.query(Debt).filter(Debt.invoice_id == invoice_id).count() == 1
    assert db.query(InvoiceLine).filter(InvoiceLine.invoice_id == invoice_id).count() == 1

    deleted = client.delete(f"/invoices/{invoice_id}", headers={"Authorization": f"Bearer {token}"})

    assert deleted.status_code == 204
    assert db.query(Debt).filter(Debt.invoice_id == invoice_id).count() == 0
    assert db.query(InvoiceLine).filter(InvoiceLine.invoice_id == invoice_id).count() == 0
