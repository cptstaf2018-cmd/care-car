from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.models.user import User
from app.services.wasnder_service import normalize_whatsapp_recipient


def normalize_contact_phone(phone: str | None) -> str:
    if not phone:
        return ""
    return normalize_whatsapp_recipient(phone, include_plus=False)


def phone_is_already_used(db: Session, phone: str | None, exclude_tenant_id: int | None = None) -> bool:
    normalized = normalize_contact_phone(phone)
    if not normalized:
        return False

    tenants = db.query(Tenant.id, Tenant.contact_phone, Tenant.whatsapp_number).all()
    for tenant_id, contact_phone, whatsapp_number in tenants:
        if exclude_tenant_id and tenant_id == exclude_tenant_id:
            continue
        if normalized in {normalize_contact_phone(contact_phone), normalize_contact_phone(whatsapp_number)}:
            return True

    users = db.query(User.email).filter(User.email.like("%@carecar.app")).all()
    for (email,) in users:
        local_part = email.rsplit("@", 1)[0]
        if normalize_contact_phone(local_part) == normalized:
            return True

    return False
