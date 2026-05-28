import secrets
import string
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, hash_password
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.user import User, Role
from app.models.tenant import Tenant, Plan
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
import httpx

router = APIRouter(prefix="/auth", tags=["auth"])


def _send_activation_whatsapp(phone: str, code: str, center_name: str) -> str:
    if not settings.PLATFORM_WASNDER_API_KEY or not settings.PLATFORM_WHATSAPP_NUMBER:
        return "not_configured"
    msg_parts = [
        f"u0645u0631u062du0628u0627u064b u0628u0643 u0641u064a u0645u0646u0635u0629 Care Car",
        f"u062au0645 u0625u0646u0634u0627u0621 u062du0633u0627u0628 u0645u0631u0643u0632 {center_name} u0628u0646u062cu0627u062d",
        f"u0643u0648u062f u0627u0644u062au0641u0639u064au0644: *{code}*",
        "u0627u0644u0643u0648u062f u0635u0627u0644u062d 48 u0633u0627u0639u0629",
    ]
    message = "
".join(msg_parts)
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


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.tenant_id:
        tenant = db.get(Tenant, user.tenant_id)
        if not tenant or not tenant.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
        # Check trial expiry (only if no paid subscription)
        if tenant.trial_ends_at and not tenant.subscription_ends_at:
            trial_end = tenant.trial_ends_at
            if trial_end.tzinfo is None:
                trial_end = trial_end.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > trial_end:
                raise HTTPException(status_code=402, detail="trial_expired")
    token = create_access_token({"sub": str(user.id), "role": user.role, "tenant_id": user.tenant_id})
    return TokenResponse(access_token=token, role=user.role, tenant_id=user.tenant_id)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


# ── Self-registration ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    center_name: str
    manager_name: str | None = None
    email: str | None = None
    phone: str | None = None


@router.post("/register", status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if not body.email and not body.phone:
        raise HTTPException(status_code=400, detail="يجب تقديم إيميل أو رقم واتساب")
    email = body.email if body.email else body.phone.strip() + "@carecar.app"
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="الحساب مسجل بالفعل، جرب تسجيل الدخول")
    if db.query(Tenant).filter(Tenant.name == body.center_name).first():
        raise HTTPException(status_code=400, detail="اسم المركز مستخدم بالفعل، جرب اسماً آخر")

    tenant = Tenant(
        name=body.center_name,
        plan=Plan.basic,
        is_active=True,
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=3),
    )
    db.add(tenant)
    db.flush()

    code = ''.join(secrets.choice(string.digits) for _ in range(6))
    expires = datetime.now(timezone.utc) + timedelta(hours=48)

    manager = User(
        tenant_id=tenant.id,
        email=email,
        hashed_password=hash_password(secrets.token_urlsafe(32)),
        full_name=body.manager_name,
        role=Role.manager,
        is_verified=False,
        activation_code=code,
        activation_expires_at=expires,
    )
    db.add(manager)
    db.commit()

    whatsapp_status = "skipped"
    if body.phone:
        whatsapp_status = _send_activation_whatsapp(body.phone, code, body.center_name)

    return {
        "activation_code": code,
        "whatsapp_status": whatsapp_status,
        "manager_email": email,
    }


# ── Activation ─────────────────────────────────────────────────────────────────

class ActivateRequest(BaseModel):
    email: str | None = None
    code: str
    new_password: str


MAX_ACTIVATION_ATTEMPTS = 10


@router.post("/activate", response_model=TokenResponse)
def activate(body: ActivateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.activation_code:
        raise HTTPException(status_code=400, detail="لا يوجد كود تفعيل لهذا البريد")
    if (user.activation_attempts or 0) >= MAX_ACTIVATION_ATTEMPTS:
        raise HTTPException(status_code=429, detail="تم تجاوز عدد المحاولات المسموح بها، تواصل مع الإدارة")
    if not user.activation_expires_at:
        raise HTTPException(status_code=400, detail="لا يوجد كود تفعيل")
    expires = user.activation_expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="انتهت صلاحية الكود، تواصل مع الإدارة")
    if user.activation_code != body.code:
        user.activation_attempts = (user.activation_attempts or 0) + 1
        db.commit()
        remaining = MAX_ACTIVATION_ATTEMPTS - user.activation_attempts
        raise HTTPException(status_code=400, detail=f"كود التفعيل غير صحيح ({remaining} محاولة متبقية)")
    user.hashed_password = hash_password(body.new_password)
    user.is_verified = True
    user.activation_code = None
    user.activation_expires_at = None
    user.activation_attempts = 0
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role, "tenant_id": user.tenant_id})
    return TokenResponse(access_token=token, role=user.role, tenant_id=user.tenant_id)
