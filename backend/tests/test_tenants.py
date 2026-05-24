from app.models.tenant import Tenant
from app.models.user import User, Role
from app.core.security import hash_password


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
