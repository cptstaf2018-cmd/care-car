from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, tenants, cars, services, invoices, inventory, debts, reports, settings, vision

app = FastAPI(title="care-car-saas")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):5173$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [auth.router, tenants.router, cars.router, services.router,
               invoices.router, inventory.router, debts.router, reports.router,
               settings.router, vision.router]:
    app.include_router(router)
