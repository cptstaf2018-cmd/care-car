from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import require_superadmin
from app.core.security import hash_password
from app.models.tenant import Tenant
from app.models.user import User, Role
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantOut

router = APIRouter(prefix="/tenants", tags=["tenants"])

class TenantWithManagerCreate(BaseModel):
    tenant: TenantCreate
    manager_email: str
    manager_password: str
    manager_name: str | None = None

@router.get("/", response_model=list[TenantOut])
def list_tenants(db: Session = Depends(get_db), _=Depends(require_superadmin)):
    return db.query(Tenant).all()

@router.post("/", response_model=TenantOut, status_code=201)
def create_tenant(body: TenantWithManagerCreate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    tenant = Tenant(**body.tenant.model_dump())
    db.add(tenant)
    db.flush()
    manager = User(
        tenant_id=tenant.id,
        email=body.manager_email,
        hashed_password=hash_password(body.manager_password),
        full_name=body.manager_name,
        role=Role.manager,
    )
    db.add(manager)
    db.commit()
    db.refresh(tenant)
    return tenant

SUPERADMIN_ALLOWED_FIELDS = {
    'name', 'plan', 'is_active', 'contact_phone',
    'subscription_starts_at', 'subscription_ends_at', 'subscription_notes',
}

@router.patch("/{tenant_id}", response_model=TenantOut)
def update_tenant(tenant_id: int, body: TenantUpdate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    updates = {k: v for k, v in body.model_dump(exclude_none=True).items() if k in SUPERADMIN_ALLOWED_FIELDS}
    for k, v in updates.items():
        setattr(tenant, k, v)
    db.commit()
    db.refresh(tenant)
    return tenant
