import logging
import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, Role
from app.models.tenant import Tenant
from app.services.vision_service import read_plate_from_image, read_text_from_image, parse_receipt_text, extract_car_brand

router = APIRouter(prefix="/vision", tags=["vision"])
logger = logging.getLogger(__name__)
PLATE_NOT_READ_MESSAGE = "لم نتمكن من قراءة رقم اللوحة من الصورة. أعد التصوير بإضاءة أوضح، أو أدخل رقم اللوحة يدوياً للمتابعة."


def _plate_recognizer(image_bytes: bytes, token: str) -> tuple[str, str, str]:
    """Call Plate Recognizer API. Returns (plate, car_type, car_color)."""
    try:
        resp = http_requests.post(
            'https://api.platerecognizer.com/v1/plate-reader/',
            data={'regions': ['iq', 'sa', 'ae', 'kw', 'bh', 'qa', 'om', 'jo', 'sy', 'lb', 'eg']},
            files={'upload': ('plate.jpg', image_bytes, 'image/jpeg')},
            headers={'Authorization': f'Token {token}'},
            timeout=15,
        )
        if not resp.ok:
            return '', '', ''
        results = resp.json().get('results', [])
        if not results:
            return '', '', ''
        r = results[0]
        plate = r.get('plate', '').upper()
        v = r.get('vehicle', {})
        make = v.get('make', [{}])[0].get('name', '') if v.get('make') else ''
        model = v.get('model', [{}])[0].get('name', '') if v.get('model') else ''
        color = v.get('color', [{}])[0].get('name', '') if v.get('color') else ''
        car_type = f"{make} {model}".strip()
        return plate, car_type, color
    except Exception:
        return '', '', ''


@router.post("/read-plate")
async def read_plate(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role == Role.superadmin:
        raise HTTPException(403, detail="Superadmin cannot use vision endpoint")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(400, detail="Image too large (max 5 MB)")

    # Get tenant's Plate Recognizer token
    tenant = db.get(Tenant, user.tenant_id)
    pr_token = getattr(tenant, 'plate_recognizer_token', None) if tenant else None

    plate, car_type, car_color = '', '', ''

    if pr_token:
        # Use Plate Recognizer API (most accurate)
        plate, car_type, car_color = _plate_recognizer(contents, pr_token)

    if not plate:
        # Fallback: local OCR / Google Vision if configured.
        try:
            full_text = read_text_from_image(contents)
            plate = read_plate_from_image(contents)
            car_type = car_type or (extract_car_brand(full_text) if full_text else '')
        except Exception:
            logger.exception("plate read failed tenant_id=%s user_id=%s", user.tenant_id, user.id)
            plate = ''

    return {
        "plate_number": plate or "",
        "car_type": car_type or "",
        "car_color": car_color or "",
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
