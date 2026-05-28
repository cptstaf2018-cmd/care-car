import secrets
import smtplib
import string
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
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
    lines = [
        "مرحباً بك في منصة Care Car \U0001f697",
        f"تم إنشاء حساب مركز «{center_name}» بنجاح.",
        f"كود التفعيل الخاص بك: *{code}*",
        "أدخل الكود في صفحة التسجيل لإكمال التفعيل.",
        "الكود صالح لمدة 48 ساعة.",
    ]
    message = "\n".join(lines)
    recipient = phone.strip()
    if recipient.startswith("0"):
        recipient = "+964" + recipient[1:]
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


def _send_activation_email(email: str, code: str, center_name: str) -> str:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return "not_configured"

    message = EmailMessage()
    message["Subject"] = "كود تفعيل حساب Care Car"
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
    message["To"] = email
    message.set_content(
        "\n".join([
            "مرحباً بك في منصة Care Car",
            f"تم إنشاء حساب مركز «{center_name}» بنجاح.",
            f"كود التفعيل الخاص بك: {code}",
            "أدخل الكود في صفحة التسجيل لإكمال التفعيل.",
            "الكود صالح لمدة 48 ساعة.",
        ])
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)
        return "sent"
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


# Self-registration

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

    delivery_status = "skipped"
    if body.phone:
        delivery_status = _send_activation_whatsapp(body.phone, code, body.center_name)
    elif body.email:
        delivery_status = _send_activation_email(body.email, code, body.center_name)

    if delivery_status != "sent":
        db.rollback()
        raise HTTPException(status_code=502, detail="تعذر إرسال كود التفعيل، حاول مرة أخرى أو اختر طريقة أخرى")

    db.commit()

    return {
        "delivery_status": delivery_status,
        "manager_email": email,
    }


# Activation

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
