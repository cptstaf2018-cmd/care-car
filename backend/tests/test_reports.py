from datetime import date
from app.models.tenant import Tenant
from app.models.user import User, Role
from app.models.car import Car
from app.core.security import hash_password


def login(client, email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]


def test_daily_report(client, db):
    t = Tenant(name="ReportCtr", plan="basic")
    db.add(t)
    db.flush()
    u = User(tenant_id=t.id, email="rep@test.com", hashed_password=hash_password("pass"), role=Role.employee)
    db.add(u)
    db.commit()

    token = login(client, "rep@test.com", "pass")
    today = date.today().isoformat()
    r = client.get(
        f"/reports/daily?target_date={today}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "service_count" in data
    assert "total_sales" in data
    assert "paid" in data
    assert "unpaid" in data


def test_superadmin_report_blocked(client, db, superadmin, superadmin_token):
    today = date.today().isoformat()
    r = client.get(
        f"/reports/daily?target_date={today}",
        headers={"Authorization": f"Bearer {superadmin_token}"},
    )
    assert r.status_code == 400
