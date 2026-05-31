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
    assert center["manager_email"] == "07700000001@carecar.app"
    assert center["manager_phone"] == "07700000001"
    assert center["registration_method"] == "whatsapp"
    assert center["registration_contact"] == "07700000001"


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
