from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime, timezone
from app.models.base import Base


class PlatformAd(Base):
    __tablename__ = "platform_ads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(300), nullable=False)
    title = Column(String(200), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PlatformPaymentSettings(Base):
    __tablename__ = "platform_payment_settings"

    id = Column(Integer, primary_key=True, default=1)
    superkey_enabled = Column(Boolean, default=True, nullable=False)
    superkey_account_name = Column(String(120), nullable=True)
    superkey_account_id = Column(String(120), nullable=True)
    superkey_qr_url = Column(String(500), nullable=True)
    superkey_instructions = Column(String(700), nullable=True)
    binance_enabled = Column(Boolean, default=True, nullable=False)
    binance_account_name = Column(String(120), nullable=True)
    binance_account_id = Column(String(120), nullable=True)
    binance_qr_url = Column(String(500), nullable=True)
    binance_instructions = Column(String(700), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
