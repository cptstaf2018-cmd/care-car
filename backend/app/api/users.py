from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_manager_or_above
from app.core.security import hash_password
from app.models.tenant import Plan, Tenant
from app.models.user import Role, User

router = APIRouter(prefix="/users", tags=["users"])

_USER_LIMITS = {
    Plan.basic.value: 1,
    Plan.pro.value: 2,
    Plan.enterprise.value: 3,
}


class CenterUserOut(BaseModel):
    id: int
    email: str
    full_name: str | None
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class CenterUserCreate(BaseModel):
    email: EmailStr
    full_name: str | None = None
    password: str


class CenterUserUpdate(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None


def _plan_value(plan) -> str:
    return getattr(plan, "value", plan) or Plan.basic.value


def _user_limit(tenant: Tenant) -> int:
    return _USER_LIMITS.get(_plan_value(tenant.plan), 1)


@router.get("/")
def list_center_users(
    db: Session = Depends(get_db),
    user: User = Depends(require_manager_or_above),
):
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Center not found")
    users = (
        db.query(User)
        .filter(User.tenant_id == tenant.id)
        .order_by(User.role.asc(), User.created_at.asc())
        .all()
    )
    return {
        "limit": _user_limit(tenant),
        "count": len(users),
        "users": [CenterUserOut.model_validate(item) for item in users],
    }


@router.post("/", response_model=CenterUserOut, status_code=201)
def create_center_user(
    body: CenterUserCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_manager_or_above),
):
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Center not found")
    current_count = db.query(User).filter(User.tenant_id == tenant.id).count()
    if current_count >= _user_limit(tenant):
        raise HTTPException(status_code=403, detail="وصلت إلى حد المستخدمين في خطتك الحالية")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    if db.query(User).filter(User.email == str(body.email)).first():
        raise HTTPException(status_code=409, detail="هذا البريد مستخدم مسبقاً")
    employee = User(
        tenant_id=tenant.id,
        email=str(body.email),
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role=Role.employee,
        is_active=True,
        is_verified=True,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.patch("/{user_id}", response_model=CenterUserOut)
def update_center_user(
    user_id: int,
    body: CenterUserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_manager_or_above),
):
    target = db.get(User, user_id)
    if not target or target.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role == Role.manager and body.is_active is False:
        raise HTTPException(status_code=400, detail="لا يمكن إيقاف حساب المدير")
    updates = body.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(target, key, value)
    db.commit()
    db.refresh(target)
    return target
