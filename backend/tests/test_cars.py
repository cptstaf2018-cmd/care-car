from app.models.tenant import Tenant
from app.models.user import User, Role
from app.core.security import hash_password

def make_tenant_manager(db):
    t = Tenant(name="Center A", plan="basic")
    db.add(t)
    db.flush()
    u = User(tenant_id=t.id, email="mgr@test.com", hashed_password=hash_password("pass123"), role=Role.manager)
    db.add(u)
    db.commit()
    return t, u

def login(client, email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]

def test_create_and_list_car(client, db):
    _, _ = make_tenant_manager(db)
    token = login(client, "mgr@test.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/cars/", json={"plate_number": "123ABC"}, headers=headers)
    assert r.status_code == 201
    assert r.json()["plate_number"] == "123ABC"
    r2 = client.get("/cars/", headers=headers)
    assert len(r2.json()) == 1

def test_duplicate_plate_rejected(client, db):
    _, _ = make_tenant_manager(db)
    token = login(client, "mgr@test.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/cars/", json={"plate_number": "DUP123"}, headers=headers)
    r = client.post("/cars/", json={"plate_number": "DUP123"}, headers=headers)
    assert r.status_code == 409

def test_tenant_isolation(client, db):
    t1 = Tenant(name="C1", plan="basic")
    t2 = Tenant(name="C2", plan="basic")
    db.add_all([t1, t2])
    db.flush()
    u1 = User(tenant_id=t1.id, email="u1@t.com", hashed_password=hash_password("p"), role=Role.manager)
    u2 = User(tenant_id=t2.id, email="u2@t.com", hashed_password=hash_password("p"), role=Role.manager)
    db.add_all([u1, u2])
    db.commit()
    t1_token = login(client, "u1@t.com", "p")
    t2_token = login(client, "u2@t.com", "p")
    client.post("/cars/", json={"plate_number": "ONLY-T1"}, headers={"Authorization": f"Bearer {t1_token}"})
    r = client.get("/cars/", headers={"Authorization": f"Bearer {t2_token}"})
    assert len(r.json()) == 0

def test_search_car(client, db):
    _, _ = make_tenant_manager(db)
    token = login(client, "mgr@test.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/cars/", json={"plate_number": "ABC999"}, headers=headers)
    client.post("/cars/", json={"plate_number": "XYZ000"}, headers=headers)
    r = client.get("/cars/?search=ABC", headers=headers)
    assert len(r.json()) == 1
    assert r.json()[0]["plate_number"] == "ABC999"
