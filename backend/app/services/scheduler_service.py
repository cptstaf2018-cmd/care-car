import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.core.database import SessionLocal
from app.models.tenant import Tenant
from app.services.reminder_service import get_due_reminders, log_reminder_message
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
            reminders = get_due_reminders(db, tenant)
            due = [r for r in reminders if r["is_due"] and r["phone"]]
            for reminder in due:
                from app.models.car import Car
                car = db.get(Car, reminder["car_id"])
                if not car:
                    continue
                status, response = send_whatsapp_message(tenant, reminder["phone"], reminder["message"])
                log_reminder_message(db, tenant, car, status, response)
                logger.info(f"Reminder [{status}] → {tenant.name} / {reminder['plate_number']}")
    except Exception:
        logger.exception("Error in daily reminders job")
    finally:
        db.close()


def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Asia/Baghdad")
    scheduler.add_job(send_daily_reminders, CronTrigger(hour=9, minute=0))
    scheduler.start()
    logger.info("Scheduler started — daily reminders at 09:00 Baghdad time")
    return scheduler
