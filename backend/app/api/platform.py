import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_superadmin
from app.models.platform_ad import PlatformAd

router = APIRouter(prefix="/platform", tags=["platform"])

UPLOADS_DIR = "/app/uploads/ads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

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
