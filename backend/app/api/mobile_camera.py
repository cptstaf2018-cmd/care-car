import base64
import hashlib
import time
from dataclasses import dataclass
from threading import Lock

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_manager_or_above
from app.core.security import create_signed_token, decode_token
from app.models.tenant import Plan, Tenant
from app.models.user import Role, User
from app.services.vision_service import fast_alpr_plate_reads

router = APIRouter(prefix="/mobile-camera", tags=["mobile-camera"])


@dataclass
class MobileFrame:
    data: bytes
    received_at: float
    signature: str


_frames: dict[int, MobileFrame] = {}
_plate_read_cache: dict[int, tuple[str, dict]] = {}
_frames_lock = Lock()
_MAX_FRAME_BYTES = 900_000
_PLAN_RANK = {Plan.basic.value: 1, Plan.pro.value: 2, Plan.enterprise.value: 3}


class MobileFrameBody(BaseModel):
    image: str


def _plan_value(plan) -> str:
    return getattr(plan, "value", plan) or Plan.basic.value


def _has_camera_feature(tenant: Tenant) -> bool:
    return _PLAN_RANK.get(_plan_value(tenant.plan), 1) >= _PLAN_RANK[Plan.enterprise.value]


def _public_base_url() -> str:
    return settings.PUBLIC_BASE_URL.rstrip("/") or "https://carecar.online"


def _camera_token(tenant_id: int) -> str:
    return create_signed_token({"purpose": "mobile_camera", "tenant_id": tenant_id})


def _decode_camera_token(token: str) -> int:
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid camera link")
    if payload.get("purpose") != "mobile_camera":
        raise HTTPException(status_code=401, detail="Invalid camera link")
    try:
        return int(payload["tenant_id"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid camera link")


def get_latest_mobile_frame(tenant_id: int, max_age: float = 4.0) -> MobileFrame | None:
    with _frames_lock:
        frame = _frames.get(tenant_id)
    if not frame or time.time() - frame.received_at > max_age:
        return None
    return frame


def _require_center_user(user: User) -> None:
    if user.role not in (Role.manager, Role.employee) or not user.tenant_id:
        raise HTTPException(status_code=403, detail="Center access required")


@router.get("/link")
def get_mobile_camera_link(
    db: Session = Depends(get_db),
    user: User = Depends(require_manager_or_above),
):
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Center not found")
    if not _has_camera_feature(tenant):
        raise HTTPException(status_code=403, detail="Camera feature is not active")
    token = _camera_token(tenant.id)
    url = f"{_public_base_url()}/mobile-camera/{token}"
    return {"url": url, "token": token, "tenant_id": tenant.id}


@router.post("/latest-plate")
def read_latest_mobile_plate(
    user: User = Depends(get_current_user),
):
    _require_center_user(user)
    frame = get_latest_mobile_frame(user.tenant_id, max_age=20.0)
    if not frame:
        raise HTTPException(status_code=404, detail="لا توجد صورة حديثة من كاميرا الموبايل. افتح الباركود واضغط تشغيل الكاميرا.")

    with _frames_lock:
        cached = _plate_read_cache.get(user.tenant_id)
    if cached and cached[0] == frame.signature:
        return {**cached[1], "cached": True}

    reads = fast_alpr_plate_reads(frame.data)
    best = reads[0] if reads else {}
    plate = best.get("plate", "")
    result = {
        "plate_number": plate,
        "confidence": float(best.get("confidence", 0) or 0),
        "candidates": [read.get("plate", "") for read in reads if read.get("plate")],
        "message": "" if plate else "لم نتمكن من قراءة اللوحة من آخر صورة. قرّب الهاتف من اللوحة واضغط قراءة مرة أخرى.",
        "cached": False,
    }
    with _frames_lock:
        _plate_read_cache[user.tenant_id] = (frame.signature, result)
    return result


@router.get("/{token}/info")
def get_mobile_camera_info(token: str, db: Session = Depends(get_db)):
    tenant_id = _decode_camera_token(token)
    tenant = db.get(Tenant, tenant_id)
    if not tenant or not tenant.is_active or not _has_camera_feature(tenant):
        raise HTTPException(status_code=404, detail="Camera link is not active")
    return {"center_name": tenant.name}


@router.post("/{token}/frame")
def push_mobile_camera_frame(token: str, body: MobileFrameBody, db: Session = Depends(get_db)):
    tenant_id = _decode_camera_token(token)
    tenant = db.get(Tenant, tenant_id)
    if not tenant or not tenant.is_active or not _has_camera_feature(tenant):
        raise HTTPException(status_code=404, detail="Camera link is not active")

    image = body.image or ""
    if "," in image:
        image = image.split(",", 1)[1]
    try:
        data = base64.b64decode(image, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image")
    if not data or len(data) > _MAX_FRAME_BYTES:
        raise HTTPException(status_code=400, detail="Invalid image size")

    signature = hashlib.sha256(data).hexdigest()
    with _frames_lock:
        current = _frames.get(tenant_id)
        if current and current.signature == signature:
            return {"ok": True, "duplicate": True}
        _frames[tenant_id] = MobileFrame(data=data, received_at=time.time(), signature=signature)
    return {"ok": True, "duplicate": False}
