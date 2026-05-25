from datetime import date, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.car import Car
from app.models.message_log import MessageLog
from app.models.service import Service
from app.models.tenant import Tenant


DEFAULT_TEMPLATE = (
    "مرحباً أستاذ {customer_name}،\n"
    "حسب سجل سيارتك رقم {plate_number} في {center_name}، اقترب موعد تبديل الدهن "
    "للحفاظ على أداء المحرك وتجنب الأعطال.\n"
    "يسعدنا رجوعك إلينا، وفريقنا جاهز لخدمتك بسرعة واحترافية."
)


def render_reminder_message(tenant: Tenant, car: Car) -> str:
    template = tenant.reminder_message_template or DEFAULT_TEMPLATE
    customer_name = car.owner_name or "عميلنا العزيز"
    values = {
        "{customer_name}": customer_name,
        "{plate_number}": car.plate_number,
        "{center_name}": tenant.name,
        "{center_phone}": tenant.contact_phone or "",
    }
    for token, value in values.items():
        template = template.replace(token, value)
    return template


def get_due_reminders(db: Session, tenant: Tenant) -> list[dict]:
    reminder_days = tenant.reminder_days or 30
    today = date.today()
    last_service_subquery = (
        db.query(
            Service.car_id.label("car_id"),
            func.max(Service.service_date).label("last_service_date"),
        )
        .filter(Service.tenant_id == tenant.id)
        .group_by(Service.car_id)
        .subquery()
    )

    rows = (
        db.query(Car, last_service_subquery.c.last_service_date)
        .outerjoin(last_service_subquery, Car.id == last_service_subquery.c.car_id)
        .filter(Car.tenant_id == tenant.id)
        .order_by(last_service_subquery.c.last_service_date.asc().nullsfirst(), Car.created_at.desc())
        .all()
    )

    reminders = []
    for car, last_service_date in rows:
        due_date = last_service_date + timedelta(days=reminder_days) if last_service_date else None
        days_left = (due_date - today).days if due_date else None
        is_due = days_left is not None and days_left <= 3
        reminders.append(
            {
                "car_id": car.id,
                "plate_number": car.plate_number,
                "owner_name": car.owner_name,
                "phone": car.phone,
                "photo_url": car.photo_url,
                "last_service_date": last_service_date,
                "due_date": due_date,
                "days_left": days_left,
                "is_due": is_due,
                "message": render_reminder_message(tenant, car),
            }
        )
    return reminders


def log_reminder_message(db: Session, tenant: Tenant, car: Car, status: str, provider_response: str | None = None) -> MessageLog:
    message = render_reminder_message(tenant, car)
    log = MessageLog(
        tenant_id=tenant.id,
        car_id=car.id,
        phone=car.phone or "",
        message=message,
        status=status,
        provider_response=provider_response,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
