import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import auth, tenants, cars, services, invoices, inventory, debts, reports, settings, vision, platform, camera_ws, webhook, mobile_camera, users
from app.core.config import settings as app_settings
from app.services.scheduler_service import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = start_scheduler() if os.getenv("START_SCHEDULER", "true").lower() == "true" else None
    yield
    if scheduler:
        scheduler.shutdown()


app = FastAPI(title="care-car-saas", lifespan=lifespan)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(self), microphone=(), geolocation=()")
    response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    response.headers.setdefault(
        "Content-Security-Policy",
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://carecar.online wss://carecar.online; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'",
    )
    return response


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

@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


os.makedirs(os.path.join(app_settings.UPLOADS_DIR, "ads"), exist_ok=True)


@app.get("/uploads/monthly_exports/{filename}", tags=["exports"])
def download_monthly_export(filename: str):
    if "/" in filename or "\\" in filename or not filename.endswith(".xlsx"):
        raise HTTPException(status_code=404, detail="Export not found")
    export_dir = os.path.realpath(os.path.join(app_settings.UPLOADS_DIR, "monthly_exports"))
    path = os.path.realpath(os.path.join(export_dir, filename))
    if not path.startswith(export_dir + os.sep) or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Export not found")
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename,
    )


app.mount("/uploads", StaticFiles(directory=app_settings.UPLOADS_DIR), name="uploads")
