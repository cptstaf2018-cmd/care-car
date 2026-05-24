from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, tenants, cars, services, invoices, inventory, debts, reports

app = FastAPI(title="Oil Center SaaS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [auth.router, tenants.router, cars.router, services.router,
               invoices.router, inventory.router, debts.router, reports.router]:
    app.include_router(router)
