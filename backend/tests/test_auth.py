from app.core.security import verify_password
from app.models import Role, User


def test_login_success(client, superadmin):
    r = client.post("/auth/login", json={"email": "admin@test.com", "password": "pass123"})
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert r.json()["role"] == "superadmin"

def test_login_wrong_password(client, superadmin):
    r = client.post("/auth/login", json={"email": "admin@test.com", "password": "wrong"})
    assert r.status_code == 401

def test_login_unknown_email(client):
    r = client.post("/auth/login", json={"email": "nobody@x.com", "password": "pass"})
    assert r.status_code == 401

def test_me_returns_user(client, superadmin_token):
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {superadmin_token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "admin@test.com"
    assert r.json()["role"] == "superadmin"

def test_me_without_token(client):
    r = client.get("/auth/me")
    assert r.status_code == 403


def test_password_reset_request_sends_code(client, db, monkeypatch):
    sent = {}

    def fake_send(email, code):
        sent["email"] = email
        sent["code"] = code
        return "sent"

    monkeypatch.setattr("app.api.auth._send_password_reset_email", fake_send)

    user = User(email="owner@test.com", hashed_password="old", role=Role.superadmin, full_name="Owner")
    db.add(user)
    db.commit()

    r = client.post("/auth/password-reset/request", json={"identifier": "owner@test.com"})

    assert r.status_code == 200
    assert sent["email"] == "owner@test.com"
    assert len(sent["code"]) == 6
    db.refresh(user)
    assert user.activation_code == sent["code"]
    assert user.activation_attempts == 0


def test_password_reset_request_does_not_reveal_unknown_account(client, monkeypatch):
    sent = {}

    def fake_send(email, code):
        sent["email"] = email
        return "sent"

    monkeypatch.setattr("app.api.auth._send_password_reset_email", fake_send)

    r = client.post("/auth/password-reset/request", json={"identifier": "missing@test.com"})

    assert r.status_code == 200
    assert r.json()["delivery_status"] == "sent_if_account_exists"
    assert sent == {}


def test_password_reset_confirm_changes_password(client, db):
    user = User(email="owner@test.com", hashed_password="old", role=Role.superadmin, full_name="Owner")
    db.add(user)
    db.commit()

    from datetime import datetime, timedelta, timezone

    user.activation_code = "123456"
    user.activation_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    r = client.post(
        "/auth/password-reset/confirm",
        json={"identifier": "owner@test.com", "code": "123456", "new_password": "new-pass-123"},
    )

    assert r.status_code == 200
    db.refresh(user)
    assert verify_password("new-pass-123", user.hashed_password)
    assert user.activation_code is None
