import os
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_manager_or_above
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantOut, TenantUpdate

router = APIRouter(prefix="/settings", tags=["settings"])

LOGO_DIR = "/app/uploads/logos"
os.makedirs(LOGO_DIR, exist_ok=True)

_LOGO_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
_MAX_LOGO_BYTES = 8 * 1024 * 1024


def _detect_logo_ext(content: bytes, content_type: str | None) -> str | None:
    if content.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "webp"
    return _LOGO_EXT.get(content_type or "")


def _logo_exists(logo_url: str | None) -> bool:
    return bool(
        logo_url
        and logo_url.startswith("/uploads/logos/")
        and os.path.exists(os.path.join("/app", logo_url.lstrip("/")))
    )


@router.get("/center", response_model=TenantOut)
def get_center_settings(db: Session = Depends(get_db), user: User = Depends(require_manager_or_above)):
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Center not found")
    if tenant.logo_url and not _logo_exists(tenant.logo_url):
        tenant.logo_url = None
        db.commit()
        db.refresh(tenant)
    return tenant


@router.patch("/center", response_model=TenantOut)
def update_center_settings(
    body: TenantUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_manager_or_above),
):
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Center not found")

    allowed = {
        "name", "contact_phone", "logo_url",
        "ip_camera_url", "ip_camera_username", "ip_camera_password",
        "wasnder_api_key", "whatsapp_number",
        "reminder_days", "reminder_message_template", "debt_message_template",
    }
    updates = body.model_dump(exclude_none=True)
    for key, value in updates.items():
        if key in allowed:
            setattr(tenant, key, value)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_manager_or_above),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="اختر صورة أولاً")
    if len(content) > _MAX_LOGO_BYTES:
        raise HTTPException(status_code=400, detail="الحجم أكبر من 8 ميغابايت")
    ext = _detect_logo_ext(content, file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="استخدم صورة JPG أو PNG أو WebP")
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(LOGO_DIR, filename)
    with open(path, "wb") as f:
        f.write(content)
    tenant = db.get(Tenant, user.tenant_id)
    if tenant.logo_url and tenant.logo_url.startswith("/uploads/logos/"):
        old_filename = os.path.basename(tenant.logo_url)
        old_path = os.path.join(LOGO_DIR, old_filename)
        safe = os.path.realpath(old_path)
        if safe.startswith(os.path.realpath(LOGO_DIR) + os.sep) and os.path.exists(safe):
            os.remove(safe)
    tenant.logo_url = f"/uploads/logos/{filename}"
    db.commit()
    return {"logo_url": tenant.logo_url}


class SubscriptionRequestBody(BaseModel):
    plan: str
    payment_ref: str


@router.post("/subscription-request")
def request_subscription(
    body: SubscriptionRequestBody,
    db: Session = Depends(get_db),
    user: User = Depends(require_manager_or_above),
):
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Center not found")
    if tenant.subscription_ends_at and tenant.subscription_ends_at > date.today():
        tenant.subscription_request_plan = None
        tenant.subscription_request_ref = None
        db.commit()
        return {"status": "active", "message": "اشتراكك نشط بالفعل"}
    tenant.subscription_request_plan = body.plan
    tenant.subscription_request_ref = body.payment_ref
    db.commit()
    return {"status": "pending", "message": "تم إرسال طلبك، سيتم التفعيل خلال 24 ساعة"}
