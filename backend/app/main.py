from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, tenants, cars, services, invoices, inventory, debts, reports, settings, vision
from app.services.scheduler_service import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = start_scheduler()
    yield
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
               settings.router, vision.router]:
    app.include_router(router)
