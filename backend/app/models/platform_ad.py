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
