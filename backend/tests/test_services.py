from datetime import date
from app.models.tenant import Tenant
from app.models.user import User, Role
from app.models.car import Car
from app.core.security import hash_password

def setup_tenant_with_car(db):
    t = Tenant(name="Oil Ctr", plan="basic")
    db.add(t)
    db.flush()
    u = User(tenant_id=t.id, email="emp@test.com", hashed_password=hash_password("pass"), role=Role.employee)
    car = Car(tenant_id=t.id, plate_number="SVC001")
    db.add_all([u, car])
    db.commit()
    return t, u, car

def login(client, email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]

def test_create_service_creates_invoice(client, db):
    _, _, car = setup_tenant_with_car(db)
    token = login(client, "emp@test.com", "pass")
    r = client.post("/services/", json={"car_id": car.id, "oil_type": "15W40", "amount": 50000},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    assert "invoice_id" in r.json()
    assert r.json()["amount"] == 50000.0
    assert r.json()["status"] == "unpaid"

def test_full_discount_marks_paid(client, db):
    _, _, car = setup_tenant_with_car(db)
    token = login(client, "emp@test.com", "pass")
    r = client.post("/services/", json={"car_id": car.id, "oil_type": "5W30", "amount": 50000, "discount": 50000},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    assert r.json()["status"] == "paid"

def test_service_for_other_tenant_car_rejected(client, db):
    t1 = Tenant(name="T1", plan="basic")
    t2 = Tenant(name="T2", plan="basic")
    db.add_all([t1, t2])
    db.flush()
    u1 = User(tenant_id=t1.id, email="e1@t.com", hashed_password=hash_password("p"), role=Role.employee)
    car2 = Car(tenant_id=t2.id, plate_number="OTHER")
    db.add_all([u1, car2])
    db.commit()
    token = login(client, "e1@t.com", "p")
    r = client.post("/services/", json={"car_id": car2.id, "oil_type": "15W40", "amount": 1000},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 404
