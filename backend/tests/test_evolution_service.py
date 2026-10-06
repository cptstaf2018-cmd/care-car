from app.core.config import settings
from app.models import Tenant
from app.services.evolution_service import send_platform_whatsapp_message, send_whatsapp_message


class FakeResponse:
    is_success = True
    text = '{"message":"success"}'


def test_platform_whatsapp_message_uses_evolution_send_text(monkeypatch):
    sent = {}

    def fake_post(url, json, headers, timeout):
        sent["url"] = url
        sent["json"] = json
        sent["headers"] = headers
        sent["timeout"] = timeout
        return FakeResponse()

    monkeypatch.setattr("app.services.evolution_service.httpx.post", fake_post)
    monkeypatch.setattr(settings, "EVOLUTION_API_URL", "http://evolution.test")
    monkeypatch.setattr(settings, "EVOLUTION_API_KEY", "secret-key")
    monkeypatch.setattr(settings, "EVOLUTION_SEND_TEXT_PATH", "/send/text")

    status, response = send_platform_whatsapp_message("07701234567", "hello")

    assert status == "sent"
    assert response == '{"message":"success"}'
    assert sent["url"] == "http://evolution.test/send/text"
    assert sent["json"] == {"number": "9647701234567", "text": "hello"}
    assert sent["headers"]["apikey"] == "secret-key"


def test_tenant_whatsapp_message_prefers_center_api_key(monkeypatch):
    sent = {}

    def fake_post(url, json, headers, timeout):
        sent["headers"] = headers
        return FakeResponse()

    monkeypatch.setattr("app.services.evolution_service.httpx.post", fake_post)
    monkeypatch.setattr(settings, "EVOLUTION_API_URL", "http://evolution.test")
    monkeypatch.setattr(settings, "EVOLUTION_API_KEY", "platform-key")

    tenant = Tenant(name="Center", wasnder_api_key="center-key", whatsapp_number="07700000000")
    status, _response = send_whatsapp_message(tenant, "+9647701234567", "hello")

    assert status == "sent"
    assert sent["headers"]["apikey"] == "center-key"
