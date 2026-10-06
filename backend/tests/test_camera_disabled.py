import pytest
from starlette.websockets import WebSocketDisconnect

from app.core.config import settings
from app.core.security import hash_password
from app.models import Role, Tenant, User


@pytest.fixture
def owner_headers(client, db):
    tenant = Tenant(name="NoCamCtr", plan="enterprise")
    db.add(tenant)
    db.flush()
    db.add(User(tenant_id=tenant.id, email="nocam@test.com", hashed_password=hash_password("pass"), role=Role.manager))
    db.commit()
    token = client.post("/auth/login", json={"email": "nocam@test.com", "password": "pass"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_camera_is_off_by_default():
    assert settings.CAMERA_ENABLED is False


def test_mobile_camera_endpoints_do_not_exist(client, owner_headers):
    assert client.get("/mobile-camera/link", headers=owner_headers).status_code == 404
    assert client.post("/mobile-camera/latest-plate", headers=owner_headers).status_code == 404
    assert client.get("/mobile-camera/sometoken/info").status_code == 404


def test_camera_websocket_does_not_exist(client):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/ws/camera/1"):
            pass


def test_plate_reading_is_stopped_even_for_the_top_plan(client, owner_headers):
    r = client.post("/vision/read-plate", files={"file": ("p.jpg", b"x", "image/jpeg")}, headers=owner_headers)
    assert r.status_code == 404


def test_receipt_reading_is_not_part_of_the_camera_feature(client, owner_headers):
    # the purchase-receipt reader stays; it is rejected for other reasons (an invalid image), not because it is disabled
    r = client.post("/vision/parse-receipt", files={"file": ("r.jpg", b"x", "image/jpeg")}, headers=owner_headers)
    assert r.status_code != 404
