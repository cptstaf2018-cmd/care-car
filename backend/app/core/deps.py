from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, Role
from app.models.tenant import Tenant

bearer = HTTPBearer()

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.tenant_id:
        tenant = db.get(Tenant, user.tenant_id)
        if not tenant or not tenant.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    return user

def require_superadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != Role.superadmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin only")
    return user

def require_manager_or_above(user: User = Depends(get_current_user)) -> User:
    if user.role == Role.employee:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager access required")
    return user

def get_tenant_id(user: User = Depends(get_current_user)) -> int:
    if user.role == Role.superadmin:
        raise HTTPException(status_code=400, detail="Superadmin must specify tenant_id")
    return user.tenant_id
