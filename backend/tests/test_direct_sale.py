from datetime import date

from app.core.security import hash_password
from app.models import Car, Role, Tenant, User
from app.models.car import WALKIN_PLATE


def _shop(db, email="shop@test.com", name="ShopCtr"):
    tenant = Tenant(name=name, plan="basic", specialty="parts_store")
    db.add(tenant)
    db.flush()
    db.add(User(tenant_id=tenant.id, email=email, hashed_password=hash_password("pass"), role=Role.manager))
    db.commit()
    return tenant


def _login(client, email="shop@test.com"):
    token = client.post("/auth/login", json={"email": email, "password": "pass"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _sell(client, headers, **overrides):
    body = {"oil_type": "بيع بطارية", "amount": 90000}
    body.update(overrides)
    return client.post("/services/", json=body, headers=headers)


def test_sale_without_a_car_creates_one_walk_in_customer(client, db):
    tenant = _shop(db)
    headers = _login(client)

    first = _sell(client, headers)
    second = _sell(client, headers, oil_type="بيع بواجي", amount=24000)

    assert first.status_code == 201 and second.status_code == 201
    walk_ins = db.query(Car).filter(Car.tenant_id == tenant.id, Car.plate_number == WALKIN_PLATE).all()
    assert len(walk_ins) == 1  # reused, not duplicated
    detail = client.get(f"/invoices/{first.json()['invoice_id']}/detail", headers=headers).json()
    assert detail["plate_number"] == WALKIN_PLATE
    assert detail["customer_name"] == "زبون عابر"


def test_walk_in_customer_is_hidden_from_the_cars_list(client, db):
    _shop(db)
    headers = _login(client)
    _sell(client, headers)
    client.post("/cars/", json={"plate_number": "REAL-1"}, headers=headers)

    plates = [c["plate_number"] for c in client.get("/cars/", headers=headers).json()]

    assert plates == ["REAL-1"]


def test_walk_in_customer_never_gets_an_oil_reminder(client, db):
    _shop(db)
    headers = _login(client)
    _sell(client, headers)

    due = client.get("/reports/maintenance-due", headers=headers).json()

    assert due["cars"] == []


def test_walk_in_sales_are_isolated_per_center(client, db):
    first = _shop(db, "a@test.com", "ShopA")
    second = _shop(db, "b@test.com", "ShopB")
    _sell(client, _login(client, "a@test.com"))
    _sell(client, _login(client, "b@test.com"))

    walk_in_owners = {c.tenant_id for c in db.query(Car).filter(Car.plate_number == WALKIN_PLATE).all()}

    assert walk_in_owners == {first.id, second.id}


def test_sale_with_a_real_car_still_works(client, db):
    tenant = _shop(db)
    car = Car(tenant_id=tenant.id, plate_number="BGD-1")
    db.add(car)
    db.commit()
    headers = _login(client)

    r = _sell(client, headers, car_id=car.id, service_date=date.today().isoformat())

    assert r.status_code == 201
    assert db.query(Car).filter(Car.plate_number == WALKIN_PLATE).count() == 0


def test_superadmin_cannot_sell_without_a_car(client, superadmin_token):
    r = client.post("/services/", json={"oil_type": "x", "amount": 1000}, headers={"Authorization": f"Bearer {superadmin_token}"})
    assert r.status_code == 400


def test_invoice_detail_tells_the_ticket_what_kind_of_center_issued_it(client, db):
    _shop(db)
    headers = _login(client)
    invoice_id = _sell(client, headers).json()["invoice_id"]

    detail = client.get(f"/invoices/{invoice_id}/detail", headers=headers).json()

    assert detail["center_specialty"] == "parts_store"
