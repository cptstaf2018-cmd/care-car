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
