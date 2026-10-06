from app.core.security import create_access_token, hash_password
from app.models.tenant import Tenant
from app.models.user import Role, User


def _token_for_center(client, db, plan="basic"):
    tenant = Tenant(name=f"Users {plan}", plan=plan)
    db.add(tenant)
    db.flush()
    manager = User(
        tenant_id=tenant.id,
        email=f"manager-{plan}@users.example.com",
        hashed_password=hash_password("pass123"),
        role=Role.manager,
        is_verified=True,
    )
    db.add(manager)
    db.commit()
    token = create_access_token({"sub": str(manager.id), "role": manager.role, "tenant_id": tenant.id})
    return token


def test_basic_plan_cannot_add_second_user(client, db):
    token = _token_for_center(client, db, "basic")

    response = client.post(
        "/users/",
        json={"email": "employee-basic@users.example.com", "password": "pass123", "full_name": "Employee"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_pro_plan_can_add_one_employee(client, db):
    token = _token_for_center(client, db, "pro")

    response = client.post(
        "/users/",
        json={"email": "employee-pro@users.example.com", "password": "pass123", "full_name": "Employee"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    assert response.json()["role"] == "employee"
