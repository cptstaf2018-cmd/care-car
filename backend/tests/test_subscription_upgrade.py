from datetime import date, timedelta

from app.core.security import hash_password
from app.models.tenant import Tenant
from app.models.user import Role, User


def login(client, email, password):
    response = client.post("/auth/login", json={"email": email, "password": password})
    return response.json()["access_token"]


def test_active_basic_center_can_request_upgrade(client, db):
    tenant = Tenant(
        name="Upgrade Center",
        plan="basic",
        subscription_ends_at=date.today() + timedelta(days=20),
    )
    db.add(tenant)
    db.flush()
    manager = User(
        tenant_id=tenant.id,
        email="upgrade@test.com",
        hashed_password=hash_password("pass"),
        role=Role.manager,
    )
    db.add(manager)
    db.commit()

    token = login(client, "upgrade@test.com", "pass")
    response = client.post(
        "/settings/subscription-request",
        json={"plan": "pro", "payment_ref": "TRX-UPGRADE-1"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "pending"
    db.refresh(tenant)
    assert tenant.subscription_request_plan == "pro"
    assert tenant.subscription_request_ref == "TRX-UPGRADE-1"


def test_active_center_cannot_request_same_plan(client, db):
    tenant = Tenant(
        name="Same Plan Center",
        plan="basic",
        subscription_ends_at=date.today() + timedelta(days=20),
    )
    db.add(tenant)
    db.flush()
    manager = User(
        tenant_id=tenant.id,
        email="same@test.com",
        hashed_password=hash_password("pass"),
        role=Role.manager,
    )
    db.add(manager)
    db.commit()

    token = login(client, "same@test.com", "pass")
    response = client.post(
        "/settings/subscription-request",
        json={"plan": "basic", "payment_ref": "TRX-SAME-1"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "active"
    db.refresh(tenant)
    assert tenant.subscription_request_plan is None
    assert tenant.subscription_request_ref is None
