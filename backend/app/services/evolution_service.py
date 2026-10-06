import re

import httpx

from app.core.config import settings
from app.models.tenant import Tenant


def _normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D+", "", phone.strip())
    if digits.startswith("00"):
        digits = digits[2:]
    if digits.startswith("0"):
        return "964" + digits[1:]
    if digits.startswith("7"):
        return "964" + digits
    return digits


def _send_text(api_key: str | None, phone: str, message: str) -> tuple[str, str]:
    if not settings.EVOLUTION_API_URL or not api_key:
        return "not_configured", "Evolution API URL or API key is missing"
    if not phone:
        return "missing_phone", "Customer phone number is missing"

    path = settings.EVOLUTION_SEND_TEXT_PATH or "/send/text"
    if "{instance}" in path:
        if not settings.EVOLUTION_INSTANCE_NAME:
            return "not_configured", "Evolution instance name is missing"
        path = path.replace("{instance}", settings.EVOLUTION_INSTANCE_NAME)

    url = f"{settings.EVOLUTION_API_URL.rstrip('/')}/{path.lstrip('/')}"
    payload = {
        "number": _normalize_phone(phone),
        "text": message,
    }
    headers = {
        "apikey": api_key,
        "Content-Type": "application/json",
    }

    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=15)
        if response.is_success:
            return "sent", response.text[:1000]
        return "failed", response.text[:1000]
    except httpx.HTTPError as exc:
        return "failed", str(exc)


def send_platform_whatsapp_message(phone: str, message: str) -> tuple[str, str]:
    return _send_text(settings.EVOLUTION_API_KEY, phone, message)


def send_whatsapp_message(tenant: Tenant, phone: str, message: str) -> tuple[str, str]:
    # The legacy wasnder_api_key column now stores a per-center Evolution API key when provided.
    api_key = tenant.wasnder_api_key or settings.EVOLUTION_API_KEY
    return _send_text(api_key, phone, message)
