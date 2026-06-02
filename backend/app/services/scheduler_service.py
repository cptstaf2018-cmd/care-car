import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.core.database import SessionLocal
from app.models.tenant import Tenant
from app.services.reminder_service import get_cars_to_notify, log_reminder_message, render_pre_reminder, render_due_reminder, render_debt_reminder
from app.services.wasnder_service import send_whatsapp_message

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
                    message = render_debt_reminder(tenant, car, item.get("debt_amount", 0))
                elif reminder_type == "due_reminder":
                    message = render_due_reminder(tenant, car)
                else:
                    message = render_pre_reminder(tenant, car)

                status, response = send_whatsapp_message(tenant, item["phone"], message)
                log_reminder_message(db, tenant, car, reminder_type, status, response, item.get("debt_amount"))
                logger.info(
                    "Reminder [%s][%s] → %s / %s",
                    reminder_type, status, tenant.name, item["plate_number"]
                )

    except Exception:
        logger.exception("Error in daily reminders job")
    finally:
        db.close()


def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Asia/Baghdad")
    # يفحص يوميا: تذكير الخدمة أو مطالبة الدين كل 20 يوم.
    scheduler.add_job(send_daily_reminders, CronTrigger(hour=8, minute=0))
    scheduler.start()
    logger.info("Scheduler started — reminders at 08:00 Baghdad time")
    return scheduler
