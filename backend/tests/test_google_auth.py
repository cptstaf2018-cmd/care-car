from datetime import datetime, timedelta, timezone

import pytest

from app.core.security import create_signed_token, hash_password
from app.models import Plan, Role, Tenant, User

GOOGLE_USER = {"email": "owner@gmail.com", "name": "أبو علي", "sub": "google-123"}


@pytest.fixture
def google_ok(monkeypatch):
    monkeypatch.setattr("app.api.auth.verify_google_credential", lambda credential: GOOGLE_USER)


@pytest.fixture
def google_bad(monkeypatch):
    def fail(credential):
        raise ValueError("bad token")
    monkeypatch.setattr("app.api.auth.verify_google_credential", fail)


def _signup_token(client):
    r = client.post("/auth/google", json={"credential": "x"})
    return r.json()["signup_token"]


def _complete(client, signup_token, **overrides):
    body = {"signup_token": signup_token, "center_name": "مركز الخليج", "specialty": "quick_service", "whatsapp": "07806688044"}
    body.update(overrides)
    return client.post("/auth/google/complete", json=body)


def test_google_new_user_needs_onboarding(client, google_ok):
    r = client.post("/auth/google", json={"credential": "x"})

    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "needs_onboarding"
    assert data["email"] == "owner@gmail.com"
    assert data["name"] == "أبو علي"
    assert data["signup_token"]
    assert "access_token" not in data


def test_google_invalid_credential_rejected(client, google_bad):
    r = client.post("/auth/google", json={"credential": "forged"})
    assert r.status_code == 401


def test_google_existing_user_logs_in(client, db, google_ok):
    tenant = Tenant(name="مركز قديم", plan=Plan.basic, is_active=True)
    db.add(tenant)
    db.flush()
    db.add(User(tenant_id=tenant.id, email="owner@gmail.com", hashed_password=hash_password("x"), role=Role.manager))
    db.commit()

    r = client.post("/auth/google", json={"credential": "x"})

    assert r.status_code == 200
    assert r.json()["status"] == "logged_in"
    assert r.json()["access_token"]
    assert r.json()["tenant_id"] == tenant.id


def test_google_existing_user_with_expired_trial_gets_402(client, db, google_ok):
    tenant = Tenant(name="مركز منتهي", plan=Plan.basic, is_active=True,
                    trial_ends_at=datetime.now(timezone.utc) - timedelta(days=1))
    db.add(tenant)
    db.flush()
    db.add(User(tenant_id=tenant.id, email="owner@gmail.com", hashed_password=hash_password("x"), role=Role.manager))
    db.commit()

    r = client.post("/auth/google", json={"credential": "x"})
    assert r.status_code == 402


def test_complete_creates_center_with_14_day_trial(client, db, google_ok):
    token = _signup_token(client)

    r = _complete(client, token)

    assert r.status_code == 201
    assert r.json()["access_token"]
    tenant = db.query(Tenant).filter(Tenant.name == "مركز الخليج").one()
    assert tenant.whatsapp_number == "07806688044"
    assert tenant.plan == Plan.basic
    trial_end = tenant.trial_ends_at.replace(tzinfo=timezone.utc)
    days_left = (trial_end - datetime.now(timezone.utc)).days
    assert days_left in (13, 14)
    user = db.query(User).filter(User.email == "owner@gmail.com").one()
    assert user.tenant_id == tenant.id
    assert user.role == Role.manager
    assert user.is_verified is True
    assert user.full_name == "أبو علي"


def test_complete_token_works_for_me_endpoint(client, google_ok):
    access = _complete(client, _signup_token(client)).json()["access_token"]
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 200
    assert r.json()["email"] == "owner@gmail.com"


@pytest.mark.parametrize("raw,stored", [
    ("07806688044", "07806688044"),
    ("+964 780 668 8044", "07806688044"),
    ("9647806688044", "07806688044"),
    ("٠٧٨٠٦٦٨٨٠٤٤", "07806688044"),
])
def test_complete_normalizes_iraqi_whatsapp(client, db, google_ok, raw, stored):
    r = _complete(client, _signup_token(client), whatsapp=raw)
    assert r.status_code == 201
    assert db.query(Tenant).one().whatsapp_number == stored


@pytest.mark.parametrize("bad", ["", "12345", "07806688", "0610000000"])
def test_complete_rejects_invalid_whatsapp(client, google_ok, bad):
    r = _complete(client, _signup_token(client), whatsapp=bad)
    assert r.status_code == 400


def test_complete_rejects_blank_center_name(client, google_ok):
    r = _complete(client, _signup_token(client), center_name="   ")
    assert r.status_code == 400


def test_complete_rejects_taken_center_name(client, db, google_ok):
    db.add(Tenant(name="مركز الخليج", plan=Plan.basic, is_active=True))
    db.commit()
    r = _complete(client, _signup_token(client))
    assert r.status_code == 409


def test_complete_rejects_forged_signup_token(client):
    forged = create_signed_token({"purpose": "something_else", "email": "x@gmail.com",
                                  "exp": datetime.now(timezone.utc) + timedelta(minutes=5)})
    r = _complete(client, forged)
    assert r.status_code == 401


def test_complete_rejects_expired_signup_token(client):
    expired = create_signed_token({"purpose": "google_signup", "email": "x@gmail.com", "name": "x",
                                   "exp": datetime.now(timezone.utc) - timedelta(minutes=1)})
    r = _complete(client, expired)
    assert r.status_code == 401


def test_signup_token_cannot_be_used_as_access_token(client, google_ok):
    token = _signup_token(client)
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_complete_twice_does_not_duplicate_account(client, google_ok):
    token = _signup_token(client)
    assert _complete(client, token).status_code == 201
    r = _complete(client, token, center_name="مركز ثاني")
    assert r.status_code == 409


def test_legacy_register_uses_14_day_trial(client, db):
    r = client.post("/auth/register", json={
        "center_name": "مركز قديم الطريقة", "full_name": "حيدر", "contact_method": "whatsapp", "whatsapp": "07701234567",
    })
    assert r.status_code == 201
    tenant = db.query(Tenant).filter(Tenant.name == "مركز قديم الطريقة").one()
    days_left = (tenant.trial_ends_at.replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)).days
    assert days_left in (13, 14)
