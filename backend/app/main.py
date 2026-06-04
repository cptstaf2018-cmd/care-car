import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import auth, tenants, cars, services, invoices, inventory, debts, reports, settings, vision, platform, camera_ws, webhook, mobile_camera, users
from app.services.scheduler_service import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = start_scheduler() if os.getenv("START_SCHEDULER", "true").lower() == "true" else None
    yield
    if scheduler:
        scheduler.shutdown()


app = FastAPI(title="care-car-saas", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?|https://carecar\.online|https://www\.carecar\.online)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


for router in [auth.router, tenants.router, cars.router, services.router,
               invoices.router, inventory.router, debts.router, reports.router,
               settings.router, vision.router, platform.router, webhook.router,
               mobile_camera.router, users.router]:
    app.include_router(router)

app.include_router(camera_ws.router)

os.makedirs("/app/uploads/ads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")
