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


def _center_with_cars(db, reminder_days=20):
    from datetime import timedelta
    from app.models.service import Service

    t = Tenant(name="DueCtr", plan="basic", reminder_days=reminder_days)
    other = Tenant(name="OtherCtr", plan="basic")
    db.add_all([t, other])
    db.flush()
    db.add(User(tenant_id=t.id, email="due@test.com", hashed_password=hash_password("pass"), role=Role.employee))
    soon = Car(tenant_id=t.id, plate_number="SOON-1", owner_name="أبو علي", phone="07801234567")
    late = Car(tenant_id=t.id, plate_number="LATE-1")
    fresh = Car(tenant_id=t.id, plate_number="FRESH-1")
    never = Car(tenant_id=t.id, plate_number="NEVER-1")
    foreign = Car(tenant_id=other.id, plate_number="FOREIGN-1")
    db.add_all([soon, late, fresh, never, foreign])
    db.flush()
    today = date.today()
    db.add_all([
        Service(tenant_id=t.id, car_id=soon.id, service_date=today - timedelta(days=18), oil_type="5W-30"),
        Service(tenant_id=t.id, car_id=late.id, service_date=today - timedelta(days=25), oil_type="5W-30"),
        Service(tenant_id=t.id, car_id=late.id, service_date=today - timedelta(days=40), oil_type="5W-30"),
        Service(tenant_id=t.id, car_id=fresh.id, service_date=today, oil_type="5W-30"),
        Service(tenant_id=other.id, car_id=foreign.id, service_date=today - timedelta(days=30), oil_type="5W-30"),
    ])
    db.commit()


def test_maintenance_due_returns_real_days_left_sorted(client, db):
    _center_with_cars(db)
    token = login(client, "due@test.com", "pass")

    r = client.get("/reports/maintenance-due", headers={"Authorization": f"Bearer {token}"})

    assert r.status_code == 200
    data = r.json()
    assert data["interval_days"] == 20
    plates = [c["plate_number"] for c in data["cars"]]
    assert plates == ["LATE-1", "SOON-1", "FRESH-1"]  # most overdue first; never-serviced and other tenants excluded
    by_plate = {c["plate_number"]: c for c in data["cars"]}
    assert by_plate["LATE-1"]["days_left"] == -5  # uses the latest service, not the oldest
    assert by_plate["SOON-1"]["days_left"] == 2
    assert by_plate["SOON-1"]["owner_name"] == "أبو علي"
    assert by_plate["FRESH-1"]["days_left"] == 20


def test_maintenance_due_respects_limit(client, db):
    _center_with_cars(db)
    token = login(client, "due@test.com", "pass")
    r = client.get("/reports/maintenance-due?limit=1", headers={"Authorization": f"Bearer {token}"})
    assert [c["plate_number"] for c in r.json()["cars"]] == ["LATE-1"]


def test_maintenance_due_blocked_for_superadmin(client, superadmin_token):
    r = client.get("/reports/maintenance-due", headers={"Authorization": f"Bearer {superadmin_token}"})
    assert r.status_code == 400


def _center_with_invoices(db):
    """Two tenants; the first has invoices on known dates so series buckets can be checked exactly."""
    from datetime import timedelta
    from app.models.invoice import Invoice, InvoiceStatus
    from app.models.service import Service

    t = Tenant(name="SeriesCtr", plan="basic")
    other = Tenant(name="SeriesOther", plan="basic")
    db.add_all([t, other])
    db.flush()
    db.add(User(tenant_id=t.id, email="series@test.com", hashed_password=hash_password("pass"), role=Role.employee))
    car = Car(tenant_id=t.id, plate_number="S-1")
    foreign_car = Car(tenant_id=other.id, plate_number="S-2")
    db.add_all([car, foreign_car])
    db.flush()

    def add(tenant_id, car_id, when, amount, status, discount=0):
        svc = Service(tenant_id=tenant_id, car_id=car_id, service_date=when, oil_type="5W-30")
        db.add(svc)
        db.flush()
        db.add(Invoice(tenant_id=tenant_id, service_id=svc.id, amount=amount, discount=discount, status=status, invoice_date=when))

    today = date.today()
    add(t.id, car.id, today, 100000, InvoiceStatus.paid)
    add(t.id, car.id, today, 50000, InvoiceStatus.unpaid, discount=5000)
    add(t.id, car.id, today - timedelta(days=2), 30000, InvoiceStatus.paid)
    add(other.id, foreign_car.id, today, 999999, InvoiceStatus.paid)
    db.commit()
    return today


def test_series_monthly_has_one_point_per_day_with_real_sums(client, db):
    from calendar import monthrange
    today = _center_with_invoices(db)
    token = login(client, "series@test.com", "pass")

    r = client.get(f"/reports/series?period=monthly&year={today.year}&month={today.month}", headers={"Authorization": f"Bearer {token}"})

    assert r.status_code == 200
    points = r.json()["points"]
    assert len(points) == monthrange(today.year, today.month)[1]
    todays = next(p for p in points if p["date"] == today.isoformat())
    assert todays["sales"] == 145000          # 100,000 + (50,000 - 5,000 discount); other tenant excluded
    assert todays["paid"] == 100000
    assert todays["unpaid"] == 45000
    assert todays["services"] == 2


def test_series_weekly_is_last_seven_days_ending_today(client, db):
    from datetime import timedelta
    today = _center_with_invoices(db)
    token = login(client, "series@test.com", "pass")

    r = client.get("/reports/series?period=weekly", headers={"Authorization": f"Bearer {token}"})

    points = r.json()["points"]
    assert [p["date"] for p in points] == [(today - timedelta(days=6 - i)).isoformat() for i in range(7)]
    assert points[-1]["sales"] == 145000
    assert points[-3]["sales"] == 30000       # two days ago


def test_series_yearly_groups_by_month(client, db):
    today = _center_with_invoices(db)
    token = login(client, "series@test.com", "pass")

    r = client.get(f"/reports/series?period=yearly&year={today.year}", headers={"Authorization": f"Bearer {token}"})

    points = r.json()["points"]
    assert len(points) == 12
    assert points[0]["date"] == f"{today.year}-01"
    this_month = next(p for p in points if p["date"] == f"{today.year}-{today.month:02d}")
    assert this_month["sales"] >= 145000


def test_series_rejects_unknown_period(client, db):
    _center_with_invoices(db)
    token = login(client, "series@test.com", "pass")
    r = client.get("/reports/series?period=decade", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422


def test_series_blocked_for_superadmin(client, superadmin_token):
    r = client.get("/reports/series?period=weekly", headers={"Authorization": f"Bearer {superadmin_token}"})
    assert r.status_code == 400
