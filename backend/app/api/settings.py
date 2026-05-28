from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_manager_or_above
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantOut, TenantUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/center", response_model=TenantOut)
def get_center_settings(db: Session = Depends(get_db), user: User = Depends(require_manager_or_above)):
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Center not found")
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
        "contact_phone",
        "logo_url",
        "ip_camera_url",
        "ip_camera_username",
        "ip_camera_password",
        "wasnder_api_key",
        "whatsapp_number",
        "reminder_days",
        "reminder_message_template",
    }
    for key, value in body.model_dump(exclude_none=True).items():
        if key in allowed:
            setattr(tenant, key, value)
    db.commit()
    db.refresh(tenant)
    return tenant


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
    tenant.subscription_request_plan = body.plan
    tenant.subscription_request_ref = body.payment_ref
    db.commit()
    return {"status": "pending", "message": "تم إرسال طلبك، سيتم التفعيل خلال 24 ساعة"}
