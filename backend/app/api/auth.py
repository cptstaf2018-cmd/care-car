from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, hash_password
from app.core.deps import get_current_user
from app.models.user import User, Role
from app.models.tenant import Tenant, Plan
from app.schemas.auth import LoginRequest, TokenResponse, UserOut, RegisterRequest, RegisterResponse
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.tenant_id:
        tenant = db.get(Tenant, user.tenant_id)
        if not tenant or not tenant.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    token = create_access_token({"sub": str(user.id), "role": user.role, "tenant_id": user.tenant_id})
    return TokenResponse(access_token=token, role=user.role, tenant_id=user.tenant_id)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    تسجيل مركز جديد تلقائياً:
    1. إنشاء Tenant بالاسم المُدخل
    2. إنشاء مستخدم Manager مرتبط بالـ Tenant
    3. إرجاع access_token مباشرة لتسجيل الدخول التلقائي
    """
    # التحقق من صحة البيانات
    if not body.center_name or not body.center_name.strip():
        raise HTTPException(status_code=400, detail="اسم المركز مطلوب")
    if not body.full_name or not body.full_name.strip():
        raise HTTPException(status_code=400, detail="الاسم الكامل مطلوب")
    if body.contact_method == "whatsapp" and not body.whatsapp:
        raise HTTPException(status_code=400, detail="رقم الواتساب مطلوب")
    if body.contact_method == "email" and not body.email:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مطلوب")

    # التحقق من عدم تكرار اسم المركز
    existing_tenant = db.query(Tenant).filter(Tenant.name == body.center_name.strip()).first()
    if existing_tenant:
        raise HTTPException(status_code=409, detail="اسم المركز مستخدم بالفعل، يرجى اختيار اسم آخر")

    # تحديد الـ email للحساب
    contact_email = str(body.email) if body.contact_method == "email" and body.email else None
    contact_phone = body.whatsapp if body.contact_method == "whatsapp" else None

    # إذا لم يكن هناك email، ننشئ email داخلي مؤقت
    if not contact_email:
        safe_name = body.center_name.strip().lower().replace(" ", "_")[:30]
        contact_email = f"{safe_name}_{secrets.token_hex(4)}@carecar.internal"

    # التحقق من عدم تكرار الـ email
    existing_user = db.query(User).filter(User.email == contact_email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="البريد الإلكتروني مستخدم بالفعل")

    # توليد كلمة مرور عشوائية مؤقتة
    temp_password = secrets.token_urlsafe(12)

    try:
        # 1. إنشاء Tenant
        tenant = Tenant(
            name=body.center_name.strip(),
            plan=Plan.basic,
            is_active=True,
            contact_phone=contact_phone,
            whatsapp_number=contact_phone,
        )
        db.add(tenant)
        db.flush()  # للحصول على tenant.id قبل commit

        # 2. إنشاء User (Manager)
        user = User(
            tenant_id=tenant.id,
            email=contact_email,
            hashed_password=hash_password(temp_password),
            full_name=body.full_name.strip(),
            role=Role.manager,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.refresh(tenant)

        # 3. توليد token لتسجيل الدخول التلقائي
        token = create_access_token({
            "sub": str(user.id),
            "role": user.role,
            "tenant_id": user.tenant_id,
        })

        logger.info(
            f"[NEW REGISTRATION] tenant_id={tenant.id} center={body.center_name!r} "
            f"user_id={user.id} email={contact_email} temp_pass={temp_password}"
        )

        return RegisterResponse(
            message=f"تم إنشاء مركز '{body.center_name}' بنجاح! كلمة المرور المؤقتة: {temp_password}",
            access_token=token,
            token_type="bearer",
            role=user.role,
            tenant_id=tenant.id,
        )

    except Exception as e:
        db.rollback()
        logger.error(f"[REGISTER ERROR] {e}")
        raise HTTPException(status_code=500, detail="حدث خطأ أثناء إنشاء الحساب، حاول مجددًا")
