from app.models.tenant import Tenant
from app.services.evolution_service import send_whatsapp_message as _send_evolution_message


def send_whatsapp_message(tenant: Tenant, phone: str, message: str) -> tuple[str, str]:
    return _send_evolution_message(tenant, phone, message)
