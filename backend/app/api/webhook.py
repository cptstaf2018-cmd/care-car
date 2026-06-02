from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.tenant import Tenant
import logging

router = APIRouter(prefix="/webhook", tags=["webhook"])
logger = logging.getLogger(__name__)


@router.post("/whatsapp/{tenant_id}")
async def whatsapp_webhook(tenant_id: int, request: Request, db: Session = Depends(get_db)):
    """Receive incoming WhatsApp messages from Wasender for a specific center."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Center not found")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Log incoming message
    logger.info(f"[Webhook] Tenant {tenant_id} ({tenant.name}) received: {body}")

    # Future: save message, trigger auto-reply, update car records, etc.
    return {"status": "received", "tenant": tenant.name}


@router.get("/whatsapp/{tenant_id}")
async def whatsapp_webhook_verify(tenant_id: int, db: Session = Depends(get_db)):
    """Verification endpoint for Wasender (GET request check)."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "ok", "center": tenant.name}
