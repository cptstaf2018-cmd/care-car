import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.deps import get_current_user
from app.models.user import User, Role
from app.services.vision_service import (
    read_text_from_image,
    parse_receipt_text,
    estimate_vehicle_color,
    fast_alpr_plate_candidates,
)

router = APIRouter(prefix="/vision", tags=["vision"])
logger = logging.getLogger(__name__)
PLATE_NOT_READ_MESSAGE = "لم نتمكن من قراءة رقم اللوحة من الصورة. أعد التصوير بإضاءة أوضح، أو أدخل رقم اللوحة يدوياً للمتابعة."


@router.post("/read-plate")
async def read_plate(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if user.role == Role.superadmin:
        raise HTTPException(403, detail="Superadmin cannot use vision endpoint")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(400, detail="Image too large (max 5 MB)")

    plate, car_type, car_color = '', '', ''
    confidence = 0
    candidates = []

    try:
        candidates = fast_alpr_plate_candidates(contents)
        if candidates:
            plate = candidates[0]
            confidence = 0.82
        car_color = estimate_vehicle_color(contents)
    except Exception:
        logger.exception("fast alpr plate read failed tenant_id=%s user_id=%s", user.tenant_id, user.id)

    return {
        "plate_number": plate or "",
        "car_type": car_type or "",
        "car_color": car_color or "",
        "confidence": confidence,
        "candidates": candidates[:4],
        "message": "" if plate else PLATE_NOT_READ_MESSAGE,
    }


@router.post("/parse-receipt")
async def parse_receipt(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if user.role == Role.superadmin:
        raise HTTPException(403, detail="Superadmin cannot use vision endpoint")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, detail="Image too large (max 10 MB)")

    full_text = read_text_from_image(contents)
    if not full_text:
        return {"items": [], "raw_text": ""}

    items = parse_receipt_text(full_text)
    return {"items": items, "raw_text": full_text}
