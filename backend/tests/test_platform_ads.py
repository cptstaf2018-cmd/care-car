from app.models.platform_ad import PlatformAd


def test_public_ads_returns_only_active(client, db):
    db.add_all([
        PlatformAd(filename="active.jpg", title="Active", is_active=True, sort_order=1),
        PlatformAd(filename="hidden.jpg", title="Hidden", is_active=False, sort_order=2),
    ])
    db.commit()

    response = client.get("/platform/ads")

    assert response.status_code == 200
    titles = [ad["title"] for ad in response.json()]
    assert titles == ["Active"]
    assert response.json()[0]["is_active"] is True


def test_admin_ads_returns_active_and_hidden(client, db, superadmin_token):
    db.add_all([
        PlatformAd(filename="active.jpg", title="Active", is_active=True, sort_order=1),
        PlatformAd(filename="hidden.jpg", title="Hidden", is_active=False, sort_order=2),
    ])
    db.commit()

    response = client.get("/platform/ads/manage", headers={"Authorization": f"Bearer {superadmin_token}"})

    assert response.status_code == 200
    titles = [ad["title"] for ad in response.json()]
    assert "Active" in titles
    assert "Hidden" in titles
