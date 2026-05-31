import secrets
import string
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import require_superadmin
from app.core.security import hash_password
from app.core.config import settings
from app.models.car import Car
from app.models.debt import Debt
from app.models.inventory import InventoryItem
from app.models.invoice import Invoice
from app.models.message_log import MessageLog
from app.models.service import Service
from app.models.tenant import Tenant
from app.models.user import User, Role
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantOut
import httpx

router = APIRouter(prefix="/tenants", tags=["tenants"])
ACTIVATION_CODE_EXPIRE_MINUTES = 30


def _send_activation_whatsapp(phone: str, code: str, center_name: str) -> str:
    if not settings.PLATFORM_WASNDER_API_KEY or not settings.PLATFORM_WHATSAPP_NUMBER:
        return "not_configured"
    message = (
        f"مرحباً بك في منصة Care Car 🚗\n"
        f"تم إنشاء حساب مركز «{center_name}» بنجاح.\n"
        f"كود التفعيل الخاص بك: *{code}*\n"
        f"افتح الرابط لتفعيل حسابك وضع كلمة مرورك:\n"
        f"https://carecar.online/activate\n"
        f"الكود صالح لمدة {ACTIVATION_CODE_EXPIRE_MINUTES} دقيقة فقط."
    )
    try:
        resp = httpx.post(
            settings.WASNDER_API_URL,
            json={"from": settings.PLATFORM_WHATSAPP_NUMBER, "to": phone, "message": message},
            headers={"Authorization": f"Bearer {settings.PLATFORM_WASNDER_API_KEY}"},
            timeout=10,
        )
        return "sent" if resp.is_success else "failed"
    except Exception:
        return "failed"


class TenantWithManagerCreate(BaseModel):
    tenant: TenantCreate
    manager_email: str
    manager_phone: str | None = None
    manager_name: str | None = None


@router.get("/")
def list_tenants(db: Session = Depends(get_db), _=Depends(require_superadmin)):
    tenants = db.query(Tenant).all()
    result = []
    for t in tenants:
        manager = db.query(User).filter(User.tenant_id == t.id, User.role == Role.manager).first()
        d = TenantOut.model_validate(t).model_dump()
        d['has_wasnder_api_key'] = bool(t.wasnder_api_key)
        d['has_plate_recognizer_token'] = bool(getattr(t, 'plate_recognizer_token', None))
        d['manager_email'] = manager.email if manager else None
        d['manager_name'] = manager.full_name if manager else None
        d['manager_phone'] = t.whatsapp_number or t.contact_phone
        if manager and manager.email.endswith('@carecar.app'):
            d['registration_method'] = 'whatsapp'
            d['registration_contact'] = t.whatsapp_number or t.contact_phone or manager.email.removesuffix('@carecar.app')
        elif manager:
            d['registration_method'] = 'email'
            d['registration_contact'] = manager.email
        else:
            d['registration_method'] = None
            d['registration_contact'] = t.whatsapp_number or t.contact_phone
        result.append(d)
    return result


@router.post("/", status_code=201)
def create_tenant(body: TenantWithManagerCreate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    tenant = Tenant(**body.tenant.model_dump())
    db.add(tenant)
    db.flush()

    code = ''.join(secrets.choice(string.digits) for _ in range(6))
    expires = datetime.now(timezone.utc) + timedelta(minutes=ACTIVATION_CODE_EXPIRE_MINUTES)

    manager = User(
        tenant_id=tenant.id,
        email=body.manager_email,
        hashed_password=hash_password(secrets.token_urlsafe(32)),
        full_name=body.manager_name,
        role=Role.manager,
        is_verified=False,
        activation_code=code,
        activation_expires_at=expires,
    )
    db.add(manager)
    db.commit()
    db.refresh(tenant)

    whatsapp_status = "skipped"
    if body.manager_phone:
        whatsapp_status = _send_activation_whatsapp(body.manager_phone, code, body.tenant.name)

    return {
        "id": tenant.id,
        "name": tenant.name,
        "plan": tenant.plan,
        "is_active": tenant.is_active,
        "activation_code": code,
        "whatsapp_status": whatsapp_status,
    }


# IMPORTANT: subscription_request_plan and subscription_request_ref MUST stay in this set
# so approvePayment() in Subscriptions.jsx can clear them by sending null values.
# Also: use exclude_unset=True (not exclude_none) in update_tenant to allow null clearing.
SUPERADMIN_ALLOWED_FIELDS = {
    'name', 'plan', 'is_active', 'contact_phone',
    'subscription_starts_at', 'subscription_ends_at', 'subscription_notes',
    'subscription_request_plan', 'subscription_request_ref',
    'plate_recognizer_token',
}


@router.patch("/{tenant_id}", response_model=TenantOut)
def update_tenant(tenant_id: int, body: TenantUpdate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items() if k in SUPERADMIN_ALLOWED_FIELDS}
    for k, v in updates.items():
        setattr(tenant, k, v)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", status_code=204)
def delete_tenant(tenant_id: int, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    db.query(MessageLog).filter(MessageLog.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(Debt).filter(Debt.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(Invoice).filter(Invoice.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(Service).filter(Service.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(Car).filter(Car.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(InventoryItem).filter(InventoryItem.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(User).filter(User.tenant_id == tenant_id).delete(synchronize_session=False)
    db.delete(tenant)
    db.commit()
    return None
