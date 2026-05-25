import httpx
from app.core.config import settings
from app.models.tenant import Tenant


def send_whatsapp_message(tenant: Tenant, phone: str, message: str) -> tuple[str, str]:
    if not tenant.wasnder_api_key or not tenant.whatsapp_number:
        return "not_configured", "WasnderAPI key or center WhatsApp number is missing"
    if not phone:
        return "missing_phone", "Customer phone number is missing"

    payload = {
        "from": tenant.whatsapp_number,
        "to": phone,
        "message": message,
    }
    headers = {"Authorization": f"Bearer {tenant.wasnder_api_key}"}

    try:
        response = httpx.post(settings.WASNDER_API_URL, json=payload, headers=headers, timeout=10)
        if response.is_success:
            return "sent", response.text[:1000]
        return "failed", response.text[:1000]
    except httpx.HTTPError as exc:
        return "failed", str(exc)
