import secrets
import string
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
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
from app.services.monthly_archive_service import run_monthly_archives
import httpx

router = APIRouter(prefix="/tenants", tags=["tenants"])
ACTIVATION_CODE_EXPIRE_MINUTES = 30


def _send_activation_whatsapp(phone: str, code: str, center_name: str) -> str:
    if not settings.PLATFORM_WASNDER_API_KEY or not settings.PLATFORM_WHATSAPP_NUMBER:
        return "not_configured"
    recipient = phone.strip()
    if recipient.startswith("0"):
        recipient = "+964" + recipient[1:]
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
            json={"to": recipient, "text": message},
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
        is_whatsapp_registration = bool(manager and manager.email.endswith('@carecar.app'))
        d = TenantOut.model_validate(t).model_dump()
        d['has_wasnder_api_key'] = bool(t.wasnder_api_key)
        d['manager_email'] = None if is_whatsapp_registration else (manager.email if manager else None)
        d['manager_name'] = manager.full_name if manager else None
        d['manager_phone'] = t.whatsapp_number or t.contact_phone
        if is_whatsapp_registration:
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


def _iso(value):
    return value.isoformat() if value else None


def _money(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


@router.get("/monitoring")
def monitor_tenants(db: Session = Depends(get_db), _=Depends(require_superadmin)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    since_30 = now - timedelta(days=30)
    tenants = db.query(Tenant).order_by(Tenant.name).all()
    rows = []

    for tenant in tenants:
        manager = db.query(User).filter(User.tenant_id == tenant.id, User.role == Role.manager).first()
        invoice_count = db.query(func.count(Invoice.id)).filter(Invoice.tenant_id == tenant.id).scalar() or 0
        service_count = db.query(func.count(Service.id)).filter(Service.tenant_id == tenant.id).scalar() or 0
        car_count = db.query(func.count(Car.id)).filter(Car.tenant_id == tenant.id).scalar() or 0
        user_count = db.query(func.count(User.id)).filter(User.tenant_id == tenant.id).scalar() or 0
        debt_total = db.query(func.coalesce(func.sum(Debt.amount), 0)).filter(Debt.tenant_id == tenant.id).scalar()
        revenue_30 = db.query(func.coalesce(func.sum(Invoice.amount - func.coalesce(Invoice.discount, 0)), 0)).filter(
            Invoice.tenant_id == tenant.id,
            Invoice.created_at >= since_30,
        ).scalar()
        failed_messages_30 = db.query(func.count(MessageLog.id)).filter(
            MessageLog.tenant_id == tenant.id,
            MessageLog.created_at >= since_30,
            MessageLog.status != "sent",
        ).scalar() or 0
        low_inventory = db.query(func.count(InventoryItem.id)).filter(
            InventoryItem.tenant_id == tenant.id,
            InventoryItem.quantity <= InventoryItem.min_threshold,
        ).scalar() or 0

        latest_activity = max(
            [
                tenant.updated_at,
                db.query(func.max(Invoice.created_at)).filter(Invoice.tenant_id == tenant.id).scalar(),
                db.query(func.max(Service.created_at)).filter(Service.tenant_id == tenant.id).scalar(),
                db.query(func.max(Car.created_at)).filter(Car.tenant_id == tenant.id).scalar(),
                db.query(func.max(MessageLog.created_at)).filter(MessageLog.tenant_id == tenant.id).scalar(),
            ],
            key=lambda value: value or datetime.min,
        )

        is_trial = bool(tenant.trial_ends_at and not tenant.subscription_ends_at)
        if tenant.subscription_ends_at:
            effective_end = tenant.subscription_ends_at
        elif tenant.trial_ends_at:
            effective_end = tenant.trial_ends_at.date()
        else:
            effective_end = None
        days_to_expiry = (effective_end - now.date()).days if effective_end else None

        issues = []
        if not tenant.is_active:
            issues.append("الحساب موقوف")
        if days_to_expiry is None:
            issues.append("اشتراك مفتوح بلا تاريخ انتهاء")
        elif days_to_expiry < 0:
            issues.append("انتهت الفترة التجريبية" if is_trial else "الاشتراك منتهي")
        elif is_trial:
            issues.append(f"فترة تجريبية — يتبقى {days_to_expiry} يوم")
        elif days_to_expiry <= 7:
            issues.append("الاشتراك قريب الانتهاء")
        if not manager:
            issues.append("لا يوجد مدير للمركز")
        if not tenant.contact_phone and not tenant.whatsapp_number:
            issues.append("لا يوجد رقم تواصل")
        if failed_messages_30:
            issues.append(f"{failed_messages_30} رسائل واتساب فاشلة")
        if low_inventory:
            issues.append(f"{low_inventory} عناصر مخزون منخفضة")

        if not tenant.is_active or (days_to_expiry is not None and days_to_expiry < 0):
            health = "critical"
        elif issues:
            health = "warning"
        else:
            health = "healthy"

        rows.append({
            "tenant_id": tenant.id,
            "name": tenant.name,
            "specialty": tenant.specialty,
            "plan": tenant.plan,
            "is_active": tenant.is_active,
            "health": health,
            "issues": issues,
            "manager_name": manager.full_name if manager else None,
            "manager_email": None if manager and manager.email.endswith('@carecar.app') else (manager.email if manager else None),
            "contact_phone": tenant.contact_phone,
            "whatsapp_number": tenant.whatsapp_number,
            "subscription_ends_at": _iso(tenant.subscription_ends_at),
            "trial_ends_at": _iso(tenant.trial_ends_at),
            "is_trial": is_trial,
            "days_to_expiry": days_to_expiry,
            "last_activity_at": _iso(latest_activity),
            "invoice_count": invoice_count,
            "service_count": service_count,
            "car_count": car_count,
            "user_count": user_count,
            "revenue_30_days": _money(revenue_30),
            "debt_total": _money(debt_total),
            "failed_messages_30_days": failed_messages_30,
            "low_inventory_count": low_inventory,
        })

    summary = {
        "total": len(rows),
        "healthy": sum(1 for row in rows if row["health"] == "healthy"),
        "warning": sum(1 for row in rows if row["health"] == "warning"),
        "critical": sum(1 for row in rows if row["health"] == "critical"),
        "active": sum(1 for row in rows if row["is_active"]),
        "revenue_30_days": sum(row["revenue_30_days"] for row in rows),
        "debt_total": sum(row["debt_total"] for row in rows),
        "failed_messages_30_days": sum(row["failed_messages_30_days"] for row in rows),
        "low_inventory_count": sum(row["low_inventory_count"] for row in rows),
    }
    rows.sort(key=lambda row: {"critical": 0, "warning": 1, "healthy": 2}[row["health"]])
    return {"summary": summary, "tenants": rows}


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


@router.post("/monthly-archives/run")
def run_monthly_archives_now(
    year: int | None = None,
    month: int | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_superadmin),
):
    return run_monthly_archives(db, year, month)


# IMPORTANT: subscription_request_plan/method/ref MUST stay in this set
# so approvePayment() in Subscriptions.jsx can clear them by sending null values.
# Also: use exclude_unset=True (not exclude_none) in update_tenant to allow null clearing.
SUPERADMIN_ALLOWED_FIELDS = {
    'name', 'specialty', 'specialty_configured', 'plan', 'is_active', 'contact_phone',
    'subscription_starts_at', 'subscription_ends_at', 'subscription_notes',
    'subscription_request_plan', 'subscription_request_method', 'subscription_request_ref',
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
