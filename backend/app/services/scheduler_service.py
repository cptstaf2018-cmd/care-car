import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.core.database import SessionLocal
from app.models.tenant import Tenant
from app.services.monthly_archive_service import run_monthly_archives
from app.services.reminder_service import get_cars_to_notify, log_reminder_message, render_pre_reminder, render_due_reminder, render_debt_reminder, render_sale_debt_reminder
from app.services.owner_summary_service import build_owner_daily_summary
from app.services.wasnder_service import send_whatsapp_message
from app.models.message_log import MessageLog

logger = logging.getLogger(__name__)


def send_daily_reminders():
    db = SessionLocal()
    try:
        tenants = db.query(Tenant).filter(
            Tenant.is_active == True,
            Tenant.wasnder_api_key != None,
            Tenant.whatsapp_number != None,
        ).all()

        for tenant in tenants:
            cars_to_notify = get_cars_to_notify(db, tenant)

            for item in cars_to_notify:
                car = item["car"]
                reminder_type = item["reminder_type"]

                if reminder_type == "debt_reminder":
                    message = render_debt_reminder(tenant, car, item.get("debt_amount", 0)) if car else render_sale_debt_reminder(tenant, item.get("customer_name"), item.get("debt_amount", 0))
                elif reminder_type == "due_reminder":
                    message = render_due_reminder(tenant, car)
                else:
                    message = render_pre_reminder(tenant, car)

                status, response = send_whatsapp_message(tenant, item["phone"], message)
                log_reminder_message(
                    db,
                    tenant,
                    car,
                    reminder_type,
                    status,
                    response,
                    item.get("debt_amount"),
                    debt_id=item.get("debt_id"),
                    phone=item.get("phone"),
                    customer_name=item.get("customer_name"),
                )
                logger.info(
                    "Reminder [%s][%s] → %s / %s",
                    reminder_type, status, tenant.name, item["plate_number"]
                )

    except Exception:
        logger.exception("Error in daily reminders job")
    finally:
        db.close()


def send_owner_summaries():
    db = SessionLocal()
    try:
        tenants = db.query(Tenant).filter(
            Tenant.is_active == True,
            Tenant.wasnder_api_key != None,
            Tenant.whatsapp_number != None,
        ).all()
        for tenant in tenants:
            phone = tenant.whatsapp_number or tenant.contact_phone
            if not phone:
                continue
            message = build_owner_daily_summary(db, tenant)
            if not message:
                continue
            status, response = send_whatsapp_message(tenant, phone, message)
            db.add(MessageLog(
                tenant_id=tenant.id,
                phone=phone,
                message=message,
                reminder_type="owner_summary",
                status=status,
                provider_response=response,
            ))
            db.commit()
            logger.info("Owner summary [%s] → %s", status, tenant.name)
    except Exception:
        logger.exception("Error in owner summary job")
    finally:
        db.close()


def send_monthly_archives():
    db = SessionLocal()
    try:
        result = run_monthly_archives(db)
        logger.info(
            "Monthly archives generated for %s centers, old files removed: %s",
            result["tenant_count"],
            result["removed_old_files"],
        )
    except Exception:
        logger.exception("Error in monthly archives job")
    finally:
        db.close()


def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Asia/Baghdad")
    # يفحص يوميا: تذكير الخدمة أو مطالبة الدين كل 20 يوم.
    scheduler.add_job(send_daily_reminders, CronTrigger(hour=8, minute=0))
    # يرسل ملخص نهاية اليوم لكل مالك مركز الساعة 9 مساءً.
    scheduler.add_job(send_owner_summaries, CronTrigger(hour=21, minute=0))
    # يرسل أرشيف Excel شهري لكل مركز في أول يوم من الشهر عن الشهر السابق.
    scheduler.add_job(send_monthly_archives, CronTrigger(day=1, hour=2, minute=30))
    scheduler.start()
    logger.info("Scheduler started — reminders 8AM, owner summary 9PM, monthly archives day 1")
    return scheduler
