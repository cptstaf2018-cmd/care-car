from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import LoginRequest, TokenResponse, UserOut, RegisterRequest, RegisterResponse
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
    طلب تسجيل مركز جديد — يحفظ الطلب ويُبلغ المسؤول.
    لا ينشئ حساباً مباشرةً؛ يحتاج السوبر أدمن لتفعيله لاحقاً.
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

    contact_info = body.whatsapp if body.contact_method == "whatsapp" else str(body.email)

    # تسجيل الطلب في السجلات
    logger.info(
        f"[REGISTER REQUEST] center={body.center_name!r} | "
        f"name={body.full_name!r} | method={body.contact_method} | contact={contact_info}"
    )

    return RegisterResponse(
        message="تم استلام طلب التسجيل بنجاح. سيتم التواصل معك قريباً لتفعيل مركزك."
    )
