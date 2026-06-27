from app.core.security import verify_password
from app.models import Role, User


class FakeWhatsappResponse:
    is_success = True
    text = "ok"


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


def test_register_whatsapp_sends_activation_code_with_evolution_api(client, monkeypatch):
    sent = {}

    def fake_post(url, json, headers, timeout):
        sent["url"] = url
        sent["payload"] = json
        sent["headers"] = headers
        sent["timeout"] = timeout
        return FakeWhatsappResponse()

    monkeypatch.setattr("app.services.wasnder_service.settings.EVOLUTION_API_URL", "http://localhost:4002")
    monkeypatch.setattr("app.services.wasnder_service.settings.EVOLUTION_API_KEY", "global-key")
    monkeypatch.setattr("app.services.wasnder_service.settings.EVOLUTION_INSTANCE_NAME", "carecar")
    monkeypatch.setattr("app.services.wasnder_service.settings.PLATFORM_WASNDER_API_KEY", "")
    monkeypatch.setattr("app.services.wasnder_service.httpx.post", fake_post)

    r = client.post(
        "/auth/register",
        json={
            "center_name": "WhatsApp Activation Center",
            "manager_name": "Manager",
            "phone": "07700000000",
        },
    )

    assert r.status_code == 201
    assert r.json()["delivery_status"] == "sent"
    assert r.json()["manager_email"] == "9647700000000@carecar.app"
    assert sent["url"] == "http://localhost:4002/message/sendText/carecar"
    assert sent["payload"]["number"] == "9647700000000"
    assert "كود التفعيل الخاص بك" in sent["payload"]["text"]
    assert sent["headers"]["apikey"] == "global-key"


def test_register_whatsapp_rejects_duplicate_phone_with_different_format(client, db, monkeypatch):
    monkeypatch.setattr("app.api.auth._send_activation_whatsapp", lambda phone, code, center_name: "sent")

    first = client.post(
        "/auth/register",
        json={
            "center_name": "First WhatsApp Center",
            "manager_name": "First Manager",
            "phone": "0780 668 8044",
        },
    )
    assert first.status_code == 201

    duplicate = client.post(
        "/auth/register",
        json={
            "center_name": "Second WhatsApp Center",
            "manager_name": "Second Manager",
            "phone": "+964 780 668 8044",
        },
    )

    assert duplicate.status_code == 409
    assert "رقم الواتساب مستخدم بالفعل" in duplicate.json()["detail"]


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
