import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_superadmin
from app.models.platform_ad import PlatformAd, PlatformPaymentSettings

router = APIRouter(prefix="/platform", tags=["platform"])

UPLOADS_DIR = os.path.join(settings.UPLOADS_DIR, "ads")
PAYMENT_UPLOADS_DIR = os.path.join(settings.UPLOADS_DIR, "payment_qr")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(PAYMENT_UPLOADS_DIR, exist_ok=True)

# Extension derived from verified content-type only — never from filename
_EXT_MAP = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

# Magic bytes for each allowed type
_MAGIC = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png":  b"\x89PNG\r\n\x1a\n",
    "image/webp": b"RIFF",
}


def _safe_path(filename: str) -> str:
    resolved = os.path.realpath(os.path.join(UPLOADS_DIR, filename))
    if not resolved.startswith(os.path.realpath(UPLOADS_DIR) + os.sep):
        raise HTTPException(status_code=400, detail="مسار غير صالح")
    return resolved


def _safe_payment_path(filename: str) -> str:
    resolved = os.path.realpath(os.path.join(PAYMENT_UPLOADS_DIR, filename))
    if not resolved.startswith(os.path.realpath(PAYMENT_UPLOADS_DIR) + os.sep):
        raise HTTPException(status_code=400, detail="مسار غير صالح")
    return resolved


def _verify_magic(content: bytes, content_type: str) -> bool:
    magic = _MAGIC.get(content_type)
    if not magic:
        return False
    if content_type == "image/webp":
        return content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    return content[:len(magic)] == magic


@router.get("/ads")
def get_ads(db: Session = Depends(get_db)):
    ads = (db.query(PlatformAd)
           .filter(PlatformAd.is_active == True)
           .order_by(PlatformAd.sort_order)
           .all())
    return [_serialize_ad(a) for a in ads]


def _serialize_ad(ad: PlatformAd) -> dict:
    return {
        "id": ad.id,
        "url": f"/uploads/ads/{ad.filename}",
        "title": ad.title,
        "is_active": ad.is_active,
        "sort_order": ad.sort_order,
    }


class PaymentSettingsBody(BaseModel):
    superkey_enabled: bool = True
    superkey_account_name: str | None = None
    superkey_account_id: str | None = None
    superkey_qr_url: str | None = None
    superkey_instructions: str | None = None
    binance_enabled: bool = True
    binance_account_name: str | None = None
    binance_account_id: str | None = None
    binance_qr_url: str | None = None
    binance_instructions: str | None = None


def _get_payment_settings(db: Session) -> PlatformPaymentSettings:
    row = db.get(PlatformPaymentSettings, 1)
    if row:
        return row
    row = PlatformPaymentSettings(
        id=1,
        superkey_enabled=True,
        superkey_account_name="سعد",
        superkey_instructions="داخل العراق: ادفع عبر سوبر كي ثم أدخل رقم العملية.",
        binance_enabled=True,
        binance_account_name="Care Car",
        binance_instructions="خارج العراق: ادفع عبر Binance Pay ثم أدخل رقم العملية.",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _serialize_payment_settings(row: PlatformPaymentSettings) -> dict:
    return {
        "superkey_enabled": row.superkey_enabled,
        "superkey_account_name": row.superkey_account_name,
        "superkey_account_id": row.superkey_account_id,
        "superkey_qr_url": row.superkey_qr_url,
        "superkey_instructions": row.superkey_instructions,
        "binance_enabled": row.binance_enabled,
        "binance_account_name": row.binance_account_name,
        "binance_account_id": row.binance_account_id,
        "binance_qr_url": row.binance_qr_url,
        "binance_instructions": row.binance_instructions,
    }


@router.get("/payment-settings")
def get_payment_settings(db: Session = Depends(get_db)):
    return _serialize_payment_settings(_get_payment_settings(db))


@router.patch("/payment-settings", dependencies=[Depends(require_superadmin)])
def update_payment_settings(body: PaymentSettingsBody, db: Session = Depends(get_db)):
    row = _get_payment_settings(db)
    data = body.model_dump()
    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip() or None
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return _serialize_payment_settings(row)


@router.post("/payment-settings/{method}/qr", dependencies=[Depends(require_superadmin)])
async def upload_payment_qr(method: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    method = method.strip().lower()
    if method not in {"superkey", "binance"}:
        raise HTTPException(status_code=400, detail="وسيلة دفع غير صحيحة")
    ext = _EXT_MAP.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="نوع الملف غير مدعوم، استخدم JPG أو PNG أو WebP")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="حجم الصورة يجب أن يكون أقل من 5 ميغابايت")
    if not _verify_magic(content, file.content_type):
        raise HTTPException(status_code=400, detail="محتوى الملف لا يطابق نوعه، الملف مرفوض")

    filename = f"{method}-{uuid.uuid4().hex}.{ext}"
    path = _safe_payment_path(filename)
    with open(path, "wb") as f:
        f.write(content)

    row = _get_payment_settings(db)
    old_url = getattr(row, f"{method}_qr_url")
    if old_url and old_url.startswith("/uploads/payment_qr/"):
        old_path = _safe_payment_path(os.path.basename(old_url))
        if os.path.exists(old_path):
            os.remove(old_path)
    setattr(row, f"{method}_qr_url", f"/uploads/payment_qr/{filename}")
    db.commit()
    db.refresh(row)
    return _serialize_payment_settings(row)


@router.get("/ads/manage", dependencies=[Depends(require_superadmin)])
def get_ads_for_admin(db: Session = Depends(get_db)):
    ads = (db.query(PlatformAd)
           .order_by(PlatformAd.sort_order, PlatformAd.id.desc())
           .all())
    return [_serialize_ad(a) for a in ads]


@router.post("/ads", dependencies=[Depends(require_superadmin)])
async def upload_ad(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = _EXT_MAP.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="نوع الملف غير مدعوم، استخدم JPG أو PNG أو WebP")

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="حجم الصورة يجب أن يكون أقل من 5 ميغابايت")

    if not _verify_magic(content, file.content_type):
        raise HTTPException(status_code=400, detail="محتوى الملف لا يطابق نوعه، الملف مرفوض")

    filename = f"{uuid.uuid4().hex}.{ext}"
    path = _safe_path(filename)

    with open(path, "wb") as f:
        f.write(content)

    title = (file.filename or "").rsplit(".", 1)[0][:100] or "إعلان"
    max_order = db.query(PlatformAd).count()
    ad = PlatformAd(filename=filename, title=title, sort_order=max_order)
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return _serialize_ad(ad)


@router.patch("/ads/{ad_id}", dependencies=[Depends(require_superadmin)])
def update_ad(ad_id: int, body: dict, db: Session = Depends(get_db)):
    ad = db.get(PlatformAd, ad_id)
    if not ad:
        raise HTTPException(status_code=404, detail="الإعلان غير موجود")
    if "title" in body:
        ad.title = str(body["title"])[:100]
    if "is_active" in body:
        ad.is_active = bool(body["is_active"])
    if "sort_order" in body:
        ad.sort_order = int(body["sort_order"])
    db.commit()
    return {"status": "updated"}


@router.delete("/ads/{ad_id}", dependencies=[Depends(require_superadmin)])
def delete_ad(ad_id: int, db: Session = Depends(get_db)):
    ad = db.get(PlatformAd, ad_id)
    if not ad:
        raise HTTPException(status_code=404, detail="الإعلان غير موجود")
    path = _safe_path(ad.filename)
    if os.path.exists(path):
        os.remove(path)
    db.delete(ad)
    db.commit()
    return {"status": "deleted"}
