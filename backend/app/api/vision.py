import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.deps import get_current_user
from app.models.user import User, Role
from app.services.vision_service import (
    read_plate_from_image,
    read_text_from_image,
    parse_receipt_text,
    extract_car_brand,
    estimate_vehicle_color,
    fast_alpr_plate_candidates,
    extract_plate_candidates,
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
    local_plate = ''
    local_candidates = []

    # For Iraqi plates, local OCR is often more useful than global plate APIs.
    try:
        full_text = read_text_from_image(contents)
        local_plate = read_plate_from_image(contents)
        local_candidates = extract_plate_candidates(full_text)
        fast_candidates = fast_alpr_plate_candidates(contents)
        for candidate in fast_candidates:
            if candidate not in local_candidates:
                local_candidates.append(candidate)
        if not local_plate and fast_candidates:
            local_plate = fast_candidates[0]
        if local_plate and local_plate not in local_candidates:
            local_candidates.insert(0, local_plate)
        car_type = extract_car_brand(full_text) if full_text else ''
        car_color = estimate_vehicle_color(contents)
    except Exception:
        logger.exception("local plate read failed tenant_id=%s user_id=%s", user.tenant_id, user.id)

    if local_plate:
        plate = local_plate
        confidence = min(confidence or 0.82, 0.82)

    merged_candidates = []
    for candidate in local_candidates + candidates:
        if candidate and candidate not in merged_candidates:
            merged_candidates.append(candidate)
    candidates = merged_candidates

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
