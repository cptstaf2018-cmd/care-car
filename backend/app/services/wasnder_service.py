import httpx
import re
from app.core.config import settings
from app.models.tenant import Tenant


def normalize_whatsapp_recipient(phone: str, include_plus: bool = True) -> str:
    recipient = re.sub(r"\D+", "", phone or "")
    if recipient.startswith("00"):
        recipient = recipient[2:]
    if recipient.startswith("0"):
        recipient = "964" + recipient[1:]
    return f"+{recipient}" if include_plus else recipient


def send_evolution_message(phone: str, message: str) -> tuple[str, str]:
    if not settings.EVOLUTION_API_URL or not settings.EVOLUTION_API_KEY or not settings.EVOLUTION_INSTANCE_NAME:
        return "not_configured", "Evolution API URL, key, or instance name is missing"
    if not phone:
        return "missing_phone", "Recipient phone number is missing"

    base_url = settings.EVOLUTION_API_URL.rstrip("/")
    url = f"{base_url}/message/sendText/{settings.EVOLUTION_INSTANCE_NAME}"
    payload = {
        "number": normalize_whatsapp_recipient(phone, include_plus=False),
        "text": message,
    }
    headers = {"apikey": settings.EVOLUTION_API_KEY}

    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=10)
        if response.is_success:
            return "sent", response.text[:1000]
        return "failed", response.text[:1000]
    except httpx.HTTPError as exc:
        return "failed", str(exc)


def send_wasnder_platform_message(phone: str, message: str) -> tuple[str, str]:
    if not settings.PLATFORM_WASNDER_API_KEY:
        return "not_configured", "Platform WasnderAPI key is missing"
    if not phone:
        return "missing_phone", "Recipient phone number is missing"

    payload = {
        "to": normalize_whatsapp_recipient(phone),
        "text": message,
    }
    headers = {"Authorization": f"Bearer {settings.PLATFORM_WASNDER_API_KEY}"}

    try:
        response = httpx.post(settings.WASNDER_API_URL, json=payload, headers=headers, timeout=10)
        if response.is_success:
            return "sent", response.text[:1000]
        return "failed", response.text[:1000]
    except httpx.HTTPError as exc:
        return "failed", str(exc)


def send_platform_whatsapp_message(phone: str, message: str) -> tuple[str, str]:
    evolution_status, evolution_response = send_evolution_message(phone, message)
    if evolution_status != "not_configured":
        return evolution_status, evolution_response

    return send_wasnder_platform_message(phone, message)


def send_whatsapp_message(tenant: Tenant, phone: str, message: str) -> tuple[str, str]:
    if not tenant.wasnder_api_key or not tenant.whatsapp_number:
        return "not_configured", "WasnderAPI key or center WhatsApp number is missing"
    if not phone:
        return "missing_phone", "Customer phone number is missing"

    payload = {
        "to": normalize_whatsapp_recipient(phone),
        "text": message,
    }
    headers = {"Authorization": f"Bearer {tenant.wasnder_api_key}"}

    try:
        response = httpx.post(settings.WASNDER_API_URL, json=payload, headers=headers, timeout=10)
        if response.is_success:
            return "sent", response.text[:1000]
        return "failed", response.text[:1000]
    except httpx.HTTPError as exc:
        return "failed", str(exc)
