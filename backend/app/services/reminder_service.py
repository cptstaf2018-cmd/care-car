from datetime import date, datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.car import Car
from app.models.debt import Debt
from app.models.message_log import MessageLog
from app.models.service import Service
from app.models.tenant import Tenant

REMINDER_INTERVAL_DAYS = 20


PRE_REMINDER_TEMPLATE = (
    "أهلاً أستاذ {customer_name} 👋\n"
    "نحب نذكّرك أن سيارة {car_type} رقم {plate_number} صار موعد خدمتها قريب.\n"
    "فريق {center_name} جاهز يفحصها ويخدمها بسرعة واهتمام حتى تبقى سيارتك بأفضل حالة.\n"
    "للحجز أو الاستفسار: {center_phone}"
)

DUE_REMINDER_TEMPLATE = (
    "أهلاً أستاذ {customer_name} 👋\n"
    "نحب نذكّرك أن سيارة {car_type} رقم {plate_number} مستحقة للخدمة اليوم.\n"
    "تشرفنا زيارتك في {center_name}، وفريقنا جاهز لخدمتك بدون تأخير.\n"
    "للتواصل: {center_phone}"
)

DEBT_REMINDER_TEMPLATE = (
    "أهلاً أستاذ {customer_name} 👋\n"
    "نذكّركم بكل احترام بوجود مبلغ متبقي قدره {debt_amount} على فاتورة خدمة سيارة رقم {plate_number}.\n"
    "يمكنكم تسديد المبلغ أو التواصل معنا لترتيب الدفع في أقرب وقت.\n"
    "{center_name}\n"
    "للتواصل: {center_phone}"
)


def _render(template: str, tenant: Tenant, car: Car) -> str:
    values = {
        "{customer_name}": car.owner_name or "عميلنا العزيز",
        "{plate_number}": car.plate_number,
        "{car_type}": car.car_type or "سيارتك",
        "{center_name}": tenant.name,
        "{center_phone}": tenant.contact_phone or "",
    }
    for token, value in values.items():
        template = template.replace(token, value)
    return template


def render_pre_reminder(tenant: Tenant, car: Car) -> str:
    return _render(PRE_REMINDER_TEMPLATE, tenant, car)


def render_due_reminder(tenant: Tenant, car: Car) -> str:
    return _render(DUE_REMINDER_TEMPLATE, tenant, car)


def render_debt_reminder(tenant: Tenant, car: Car, debt_amount: float | int | str) -> str:
    message = _render(DEBT_REMINDER_TEMPLATE, tenant, car)
    return message.replace("{debt_amount}", f"{float(debt_amount):,.0f} د.ع" if isinstance(debt_amount, (int, float)) else str(debt_amount))


def _last_sent_at(db: Session, tenant_id: int, car_id: int, reminder_type: str) -> datetime | None:
    log = db.query(MessageLog).filter(
        MessageLog.tenant_id == tenant_id,
        MessageLog.car_id == car_id,
        MessageLog.reminder_type == reminder_type,
        MessageLog.status == "sent",
    ).order_by(MessageLog.sent_at.desc(), MessageLog.id.desc()).first()
    return log.sent_at if log else None


def _can_send_every_interval(db: Session, tenant_id: int, car_id: int, reminder_type: str, today: date) -> bool:
    last_sent_at = _last_sent_at(db, tenant_id, car_id, reminder_type)
    if not last_sent_at:
        return True
    sent_date = last_sent_at.date() if hasattr(last_sent_at, "date") else last_sent_at
    return (today - sent_date).days >= REMINDER_INTERVAL_DAYS


def _already_sent(db: Session, tenant_id: int, car_id: int, reminder_type: str) -> bool:
    return _last_sent_at(db, tenant_id, car_id, reminder_type) is not None


def get_due_reminders(db: Session, tenant: Tenant) -> list[dict]:
    reminder_days = tenant.reminder_days or REMINDER_INTERVAL_DAYS
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
        reminders.append({
            "car_id": car.id,
            "plate_number": car.plate_number,
            "owner_name": car.owner_name,
            "phone": car.phone,
            "photo_url": car.photo_url,
            "last_service_date": last_service_date,
            "due_date": due_date,
            "days_left": days_left,
            "is_pre_due": days_left == 2,
            "is_due_today": days_left == 0,
        })
    return reminders


def get_debt_reminders(db: Session, tenant: Tenant) -> list[dict]:
    today = date.today()
    rows = (
        db.query(Car, func.coalesce(func.sum(Debt.amount), 0).label("debt_amount"))
        .join(Debt, Debt.car_id == Car.id)
        .filter(Car.tenant_id == tenant.id, Debt.tenant_id == tenant.id)
        .group_by(Car.id)
        .having(func.coalesce(func.sum(Debt.amount), 0) > 0)
        .all()
    )

    reminders = []
    for car, debt_amount in rows:
        if not car.phone:
            continue
        if not _can_send_every_interval(db, tenant.id, car.id, "debt_reminder", today):
            continue
        reminders.append({
            "car_id": car.id,
            "plate_number": car.plate_number,
            "owner_name": car.owner_name,
            "phone": car.phone,
            "debt_amount": float(debt_amount or 0),
            "reminder_type": "debt_reminder",
            "car": car,
        })
    return reminders


def get_cars_to_notify(db: Session, tenant: Tenant) -> list[dict]:
    """
    Returns cars that need a message today:
    - pre_reminder: two days before the oil/service due date
    - due_reminder: on the oil/service due date
    - debt_reminder: every 20 days while the car still has debt
    """
    reminders = get_due_reminders(db, tenant)
    result = []

    for r in reminders:
        if not r["phone"]:
            continue

        car = db.get(Car, r["car_id"])
        if not car:
            continue

        if r["is_pre_due"] and not _already_sent(db, tenant.id, car.id, "pre_reminder"):
            result.append({**r, "reminder_type": "pre_reminder", "car": car})

        if r["is_due_today"] and not _already_sent(db, tenant.id, car.id, "due_reminder"):
            result.append({**r, "reminder_type": "due_reminder", "car": car})

    result.extend(get_debt_reminders(db, tenant))
    return result


def log_reminder_message(
    db: Session,
    tenant: Tenant,
    car: Car,
    reminder_type: str,
    status: str,
    provider_response: str | None = None,
    debt_amount: float | int | str | None = None,
) -> MessageLog:
    if reminder_type == "debt_reminder":
        message = render_debt_reminder(tenant, car, debt_amount or 0)
    elif reminder_type == "due_reminder":
        message = render_due_reminder(tenant, car)
    else:
        message = render_pre_reminder(tenant, car)

    log = MessageLog(
        tenant_id=tenant.id,
        car_id=car.id,
        phone=car.phone or "",
        message=message,
        reminder_type=reminder_type,
        status=status,
        provider_response=provider_response,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
