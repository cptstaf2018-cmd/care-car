import logging
import re
import secrets
import smtplib
import string
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, create_signed_token, decode_token, hash_password, verify_password
from app.models.tenant import Plan, Tenant
from app.models.user import Role, User
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.services.evolution_service import send_platform_whatsapp_message
from app.services.google_auth_service import verify_google_credential

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
ACTIVATION_CODE_EXPIRE_MINUTES = 30
PASSWORD_RESET_CODE_EXPIRE_MINUTES = 15
TRIAL_DAYS = 14
GOOGLE_SIGNUP_TOKEN_MINUTES = 30
GOOGLE_SIGNUP_PURPOSE = "google_signup"
MAX_PASSWORD_RESET_ATTEMPTS = 10
CENTER_SPECIALTIES = {
    "quick_service",
    "tires",
    "wash",
    "electrical",
    "mechanic",
    "ac",
    "body_paint",
    "parts_store",
}


class RegisterRequest(BaseModel):
    center_name: str
    specialty: str = "quick_service"
    full_name: str | None = None
    manager_name: str | None = None
    contact_method: str | None = None
    whatsapp: str | None = None
    phone: str | None = None
    email: EmailStr | None = None


class ActivateRequest(BaseModel):
    email: str | None = None
    code: str
    new_password: str


class PasswordResetRequest(BaseModel):
    identifier: str


class PasswordResetConfirmRequest(BaseModel):
    identifier: str
    code: str
    new_password: str


_EASTERN_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")
_IRAQI_MOBILE = re.compile(r"^(?:00964|964|0)?(7\d{9})$")


def _normalize_iraqi_mobile(raw: str) -> str | None:
    """Return the number as 07XXXXXXXXX, or None if it is not an Iraqi mobile number."""
    digits = re.sub(r"\D", "", (raw or "").translate(_EASTERN_DIGITS))
    match = _IRAQI_MOBILE.match(digits)
    return "0" + match.group(1) if match else None


def _normalize_login_identifier(identifier: str) -> str:
    normalized = identifier.strip()
    if "@" not in normalized:
        return (_normalize_iraqi_mobile(normalized) or normalized) + "@carecar.app"
    local, _, domain = normalized.rpartition("@")
    if domain == "carecar.app":  # phone-based accounts: accept +964 / 964 / 07 spellings of the same number
        return (_normalize_iraqi_mobile(local) or local) + "@carecar.app"
    return normalized


def _generate_numeric_code() -> str:
    return "".join(secrets.choice(string.digits) for _ in range(6))


def _send_activation_whatsapp(phone: str, code: str, center_name: str) -> str:
    message = "\n".join([
        "مرحباً بك في منصة Care Car 🚗",
        f"تم إنشاء حساب مركز «{center_name}» بنجاح.",
        f"كود التفعيل الخاص بك: *{code}*",
        "أدخل الكود في صفحة التسجيل لإكمال التفعيل.",
        f"الكود صالح لمدة {ACTIVATION_CODE_EXPIRE_MINUTES} دقيقة فقط.",
    ])
    status, _response = send_platform_whatsapp_message(phone, message)
    return status


def _send_activation_email(email: str, code: str, center_name: str) -> str:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return "not_configured"

    message = EmailMessage()
    message["Subject"] = "كود تفعيل حساب مركزك في Care Car"
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
    message["To"] = email
    message.set_content("\n".join([
        f"مرحباً {center_name}",
        "تم استلام طلب إنشاء حساب مركزك في منصة Care Car.",
        f"كود التفعيل: {code}",
        f"الكود صالح لمدة {ACTIVATION_CODE_EXPIRE_MINUTES} دقيقة فقط.",
        "إذا لم تطلب إنشاء الحساب، يمكنك تجاهل هذه الرسالة.",
    ]))
    message.add_alternative(f"""
<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;background:#f4f7fb;font-family:Arial,Tahoma,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.08);">
            <tr>
              <td style="background:#07111f;padding:24px 28px;text-align:right;">
                <div style="display:inline-block;background:#22d3ee;color:#07111f;border-radius:12px;padding:10px 13px;font-weight:900;font-size:18px;">CC</div>
                <h1 style="margin:16px 0 4px;color:#ffffff;font-size:24px;line-height:1.5;">تفعيل حساب مركزك</h1>
                <p style="margin:0;color:#a5f3fc;font-size:13px;font-weight:700;">Care Car SaaS</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 10px;font-size:16px;line-height:1.9;">مرحباً،</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.9;color:#334155;">
                  تم استلام طلب إنشاء حساب لمركز <strong>{center_name}</strong>. استخدم كود التفعيل التالي لإكمال إعداد الحساب.
                </p>
                <div style="margin:22px 0;padding:20px;border-radius:16px;background:#ecfeff;border:1px solid #a5f3fc;text-align:center;">
                  <div style="font-size:13px;color:#0f766e;font-weight:800;margin-bottom:8px;">كود التفعيل</div>
                  <div style="direction:ltr;letter-spacing:10px;font-size:34px;font-weight:900;color:#07111f;font-family:'Courier New',monospace;">{code}</div>
                </div>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#475569;">
                  هذا الكود صالح لمدة <strong>{ACTIVATION_CODE_EXPIRE_MINUTES} دقيقة فقط</strong>. حفاظاً على أمان حسابك، لا تشارك الكود مع أي شخص.
                </p>
                <div style="border-top:1px solid #e2e8f0;padding-top:18px;">
                  <p style="margin:0;font-size:13px;line-height:1.8;color:#64748b;">
                    إذا لم تطلب إنشاء هذا الحساب، تجاهل الرسالة ولن يتم تفعيل أي حساب بدون إدخال الكود.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""", subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)
        return "sent"
    except Exception:
        return "failed"


def _send_password_reset_whatsapp(phone: str, code: str) -> str:
    message = "\n".join([
        "طلب تغيير كلمة المرور في منصة Care Car",
        f"كود إعادة التعيين الخاص بك: *{code}*",
        f"الكود صالح لمدة {PASSWORD_RESET_CODE_EXPIRE_MINUTES} دقيقة فقط.",
        "إذا لم تطلب تغيير كلمة المرور، تجاهل هذه الرسالة.",
    ])
    status, _response = send_platform_whatsapp_message(phone, message)
    return status


def _send_password_reset_email(email: str, code: str) -> str:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return "not_configured"

    message = EmailMessage()
    message["Subject"] = "كود تغيير كلمة المرور في Care Car"
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
    message["To"] = email
    message.set_content("\n".join([
        "تم استلام طلب تغيير كلمة المرور لحسابك في Care Car.",
        f"كود إعادة التعيين: {code}",
        f"الكود صالح لمدة {PASSWORD_RESET_CODE_EXPIRE_MINUTES} دقيقة فقط.",
        "إذا لم تطلب تغيير كلمة المرور، يمكنك تجاهل هذه الرسالة.",
    ]))
    message.add_alternative(f"""
<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;background:#f4f7fb;font-family:Arial,Tahoma,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.08);">
            <tr>
              <td style="background:#07111f;padding:24px 28px;text-align:right;">
                <div style="display:inline-block;background:#22d3ee;color:#07111f;border-radius:12px;padding:10px 13px;font-weight:900;font-size:18px;">CC</div>
                <h1 style="margin:16px 0 4px;color:#ffffff;font-size:24px;line-height:1.5;">تغيير كلمة المرور</h1>
                <p style="margin:0;color:#a5f3fc;font-size:13px;font-weight:700;">Care Car SaaS</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.9;color:#334155;">
                  استخدم الكود التالي لتعيين كلمة مرور جديدة لحسابك.
                </p>
                <div style="margin:22px 0;padding:20px;border-radius:16px;background:#ecfeff;border:1px solid #a5f3fc;text-align:center;">
                  <div style="font-size:13px;color:#0f766e;font-weight:800;margin-bottom:8px;">كود إعادة التعيين</div>
                  <div style="direction:ltr;letter-spacing:10px;font-size:34px;font-weight:900;color:#07111f;font-family:'Courier New',monospace;">{code}</div>
                </div>
                <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">
                  هذا الكود صالح لمدة <strong>{PASSWORD_RESET_CODE_EXPIRE_MINUTES} دقيقة فقط</strong>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""", subtype="html")

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
    identifier = _normalize_login_identifier(body.email)
    user = db.query(User).filter(User.email == identifier).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    _ensure_tenant_can_login(user, db)
    token = create_access_token({"sub": str(user.id), "role": user.role, "tenant_id": user.tenant_id})
    return TokenResponse(access_token=token, role=user.role, tenant_id=user.tenant_id)


def _ensure_tenant_can_login(user: User, db: Session) -> None:
    if not user.tenant_id:
        return
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    if tenant.trial_ends_at and not tenant.subscription_ends_at:
        trial_end = tenant.trial_ends_at
        if trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > trial_end:
            raise HTTPException(status_code=402, detail="trial_expired")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/register", status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if not body.center_name or not body.center_name.strip():
        raise HTTPException(status_code=400, detail="اسم المركز مطلوب")

    center_name = body.center_name.strip()
    specialty = body.specialty if body.specialty in CENTER_SPECIALTIES else "quick_service"
    if db.query(Tenant).filter(Tenant.name == center_name).first():
        raise HTTPException(status_code=409, detail="اسم المركز مستخدم بالفعل، يرجى اختيار اسم آخر")

    uses_auto_login_flow = bool(body.full_name or body.contact_method)
    if uses_auto_login_flow:
        return _register_with_auto_login(body, db, center_name, specialty)
    return _register_with_activation_code(body, db, center_name, specialty)


def _register_with_auto_login(body: RegisterRequest, db: Session, center_name: str, specialty: str):
    if not body.full_name or not body.full_name.strip():
        raise HTTPException(status_code=400, detail="الاسم الكامل مطلوب")
    if body.contact_method == "whatsapp" and not body.whatsapp:
        raise HTTPException(status_code=400, detail="رقم الواتساب مطلوب")
    if body.contact_method == "email" and not body.email:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مطلوب")

    contact_email = str(body.email) if body.contact_method == "email" and body.email else None
    contact_phone = body.whatsapp if body.contact_method == "whatsapp" else None
    if not contact_email:
        safe_name = center_name.lower().replace(" ", "_")[:30]
        contact_email = f"{safe_name}_{secrets.token_hex(4)}@carecar.internal"
    if db.query(User).filter(User.email == contact_email).first():
        raise HTTPException(status_code=409, detail="البريد الإلكتروني مستخدم بالفعل")

    temp_password = secrets.token_urlsafe(12)
    try:
        tenant = Tenant(
            name=center_name,
            specialty=specialty,
            plan=Plan.basic,
            is_active=True,
            contact_phone=contact_phone,
            whatsapp_number=contact_phone,
            trial_ends_at=datetime.now(timezone.utc) + timedelta(days=TRIAL_DAYS),
        )
        db.add(tenant)
        db.flush()

        user = User(
            tenant_id=tenant.id,
            email=contact_email,
            hashed_password=hash_password(temp_password),
            full_name=body.full_name.strip(),
            role=Role.manager,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.refresh(tenant)

        token = create_access_token({"sub": str(user.id), "role": user.role, "tenant_id": user.tenant_id})
        logger.info("[NEW REGISTRATION] tenant_id=%s user_id=%s email=%s", tenant.id, user.id, contact_email)
        return {
            "message": f"تم إنشاء مركز '{center_name}' بنجاح! كلمة المرور المؤقتة: {temp_password}",
            "access_token": token,
            "token_type": "bearer",
            "role": user.role,
            "tenant_id": tenant.id,
        }
    except Exception as exc:
        db.rollback()
        logger.error("[REGISTER ERROR] %s", exc)
        raise HTTPException(status_code=500, detail="حدث خطأ أثناء إنشاء الحساب، حاول مجددًا")


def _register_with_activation_code(body: RegisterRequest, db: Session, center_name: str, specialty: str):
    if not body.email and not body.phone:
        raise HTTPException(status_code=400, detail="يجب تقديم إيميل أو رقم واتساب")

    phone = None
    if body.phone:
        phone = _normalize_iraqi_mobile(body.phone)
        if not phone:
            raise HTTPException(status_code=400, detail="اكتب رقم واتساب عراقي صحيح مثل 07801234567")

    manager_email = str(body.email) if body.email else phone + "@carecar.app"
    if db.query(User).filter(User.email == manager_email).first():
        raise HTTPException(status_code=400, detail="الحساب مسجل بالفعل، جرب تسجيل الدخول")

    tenant = Tenant(
        name=center_name,
        specialty=specialty,
        plan=Plan.basic,
        is_active=True,
        contact_phone=phone,
        whatsapp_number=phone,
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=TRIAL_DAYS),
    )
    db.add(tenant)
    db.flush()

    code = _generate_numeric_code()
    manager = User(
        tenant_id=tenant.id,
        email=manager_email,
        hashed_password=hash_password(secrets.token_urlsafe(32)),
        full_name=body.manager_name,
        role=Role.manager,
        is_active=True,
        is_verified=False,
        activation_code=code,
        activation_expires_at=datetime.now(timezone.utc) + timedelta(minutes=ACTIVATION_CODE_EXPIRE_MINUTES),
    )
    db.add(manager)

    delivery_status = _send_activation_whatsapp(phone, code, center_name) if phone else _send_activation_email(str(body.email), code, center_name)
    if delivery_status != "sent":
        db.rollback()
        raise HTTPException(status_code=502, detail="تعذر إرسال كود التفعيل، حاول مرة أخرى أو اختر طريقة أخرى")

    db.commit()
    return {"delivery_status": delivery_status, "manager_email": manager_email}


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


@router.post("/password-reset/request")
def request_password_reset(body: PasswordResetRequest, db: Session = Depends(get_db)):
    identifier = body.identifier.strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="الإيميل أو رقم الواتساب مطلوب")

    user = db.query(User).filter(User.email == _normalize_login_identifier(identifier)).first()
    if not user:
        raise HTTPException(status_code=404, detail="لا يوجد حساب بهذه البيانات")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="الحساب غير نشط")

    code = _generate_numeric_code()
    user.activation_code = code
    user.activation_expires_at = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_CODE_EXPIRE_MINUTES)
    user.activation_attempts = 0

    delivery_status = "failed"
    if "@" in identifier and not user.email.endswith("@carecar.app"):
        delivery_status = _send_password_reset_email(user.email, code)
    else:
        phone = identifier if "@" not in identifier else None
        if not phone and user.tenant_id:
            tenant = db.get(Tenant, user.tenant_id)
            phone = tenant.whatsapp_number or tenant.contact_phone if tenant else None
        if phone:
            delivery_status = _send_password_reset_whatsapp(phone, code)
        elif not user.email.endswith("@carecar.app"):
            delivery_status = _send_password_reset_email(user.email, code)

    if delivery_status != "sent":
        db.rollback()
        raise HTTPException(status_code=502, detail="تعذر إرسال كود إعادة التعيين، حاول لاحقاً أو استخدم طريقة أخرى")

    db.commit()
    return {"delivery_status": delivery_status}


@router.post("/password-reset/confirm")
def confirm_password_reset(body: PasswordResetConfirmRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == _normalize_login_identifier(body.identifier)).first()
    if not user or not user.activation_code:
        raise HTTPException(status_code=400, detail="لا يوجد كود إعادة تعيين لهذا الحساب")
    if (user.activation_attempts or 0) >= MAX_PASSWORD_RESET_ATTEMPTS:
        raise HTTPException(status_code=429, detail="تم تجاوز عدد المحاولات المسموح بها، تواصل مع الإدارة")
    if not user.activation_expires_at:
        raise HTTPException(status_code=400, detail="لا يوجد كود إعادة تعيين")

    expires = user.activation_expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="انتهت صلاحية الكود، اطلب كوداً جديداً")
    if user.activation_code != body.code:
        user.activation_attempts = (user.activation_attempts or 0) + 1
        db.commit()
        remaining = MAX_PASSWORD_RESET_ATTEMPTS - user.activation_attempts
        raise HTTPException(status_code=400, detail=f"كود إعادة التعيين غير صحيح ({remaining} محاولة متبقية)")

    user.hashed_password = hash_password(body.new_password)
    user.is_verified = True
    user.activation_code = None
    user.activation_expires_at = None
    user.activation_attempts = 0
    db.commit()
    return {"message": "تم تغيير كلمة المرور بنجاح"}


class GoogleLoginRequest(BaseModel):
    credential: str


class GoogleCompleteRequest(BaseModel):
    signup_token: str
    center_name: str
    specialty: str = "quick_service"
    whatsapp: str


def _read_google_signup_token(token: str) -> dict:
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="انتهت صلاحية التسجيل، سجّل بحساب Google مرة ثانية")
    if payload.get("purpose") != GOOGLE_SIGNUP_PURPOSE or not payload.get("email"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="رمز التسجيل غير صالح")
    return payload


@router.post("/google")
def google_login(body: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        profile = verify_google_credential(body.credential)
    except ValueError as exc:
        logger.warning("[GOOGLE LOGIN] verification failed: %s", exc)
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="تسجيل Google غير مفعّل بالخادم")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="تعذر التحقق من حساب Google")

    user = db.query(User).filter(User.email == profile["email"]).first()
    if user:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
        _ensure_tenant_can_login(user, db)
        token = create_access_token({"sub": str(user.id), "role": user.role, "tenant_id": user.tenant_id})
        return {"status": "logged_in", "access_token": token, "token_type": "bearer",
                "role": user.role, "tenant_id": user.tenant_id}

    signup_token = create_signed_token({
        "purpose": GOOGLE_SIGNUP_PURPOSE,
        "email": profile["email"],
        "name": profile["name"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=GOOGLE_SIGNUP_TOKEN_MINUTES),
    })
    return {"status": "needs_onboarding", "signup_token": signup_token,
            "email": profile["email"], "name": profile["name"]}


@router.post("/google/complete", status_code=201)
def google_complete_signup(body: GoogleCompleteRequest, db: Session = Depends(get_db)):
    payload = _read_google_signup_token(body.signup_token)
    center_name = body.center_name.strip()
    if not center_name:
        raise HTTPException(status_code=400, detail="اسم المركز مطلوب")
    whatsapp = _normalize_iraqi_mobile(body.whatsapp)
    if not whatsapp:
        raise HTTPException(status_code=400, detail="اكتب رقم واتساب عراقي صحيح مثل 07801234567")
    if db.query(User).filter(User.email == payload["email"]).first():
        raise HTTPException(status_code=409, detail="هذا الحساب مسجّل مسبقاً، سجّل دخول بحساب Google")
    if db.query(Tenant).filter(Tenant.name == center_name).first():
        raise HTTPException(status_code=409, detail="اسم المركز مستخدم بالفعل، يرجى اختيار اسم آخر")

    try:
        specialty = body.specialty if body.specialty in CENTER_SPECIALTIES else "quick_service"
        tenant = Tenant(
            name=center_name,
            specialty=specialty,
            plan=Plan.basic,
            is_active=True,
            contact_phone=whatsapp,
            whatsapp_number=whatsapp,
            trial_ends_at=datetime.now(timezone.utc) + timedelta(days=TRIAL_DAYS),
        )
        db.add(tenant)
        db.flush()
        user = User(
            tenant_id=tenant.id,
            email=payload["email"],
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            full_name=payload.get("name"),
            role=Role.manager,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("[GOOGLE REGISTRATION] tenant_id=%s user_id=%s", tenant.id, user.id)
    except HTTPException:
        raise
    except Exception as exc:  # TEMP diagnostic
        db.rollback()
        logger.exception("[GOOGLE REGISTRATION] failed")
        raise HTTPException(status_code=500, detail=f"تعذر فتح الحساب [{type(exc).__name__}: {str(exc)[:300]}]")

    token = create_access_token({"sub": str(user.id), "role": user.role, "tenant_id": user.tenant_id})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "tenant_id": tenant.id}
