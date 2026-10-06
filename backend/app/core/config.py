from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FIRST_SUPERADMIN_EMAIL: str = "admin@oil.com"
    FIRST_SUPERADMIN_PASSWORD: str = "Admin1234!"
    WASNDER_API_URL: str = "https://www.wasenderapi.com/api/send-message"
    PLATFORM_WASNDER_API_KEY: str = ""
    PLATFORM_WHATSAPP_NUMBER: str = ""
    EVOLUTION_API_URL: str = "http://localhost:8080"
    EVOLUTION_API_KEY: str = ""
    EVOLUTION_SEND_TEXT_PATH: str = "/send/text"
    EVOLUTION_INSTANCE_NAME: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Care Car"
    PUBLIC_BASE_URL: str = "https://carecar.online"
    GOOGLE_CLIENT_ID: str = ""
    # Plate-reading camera (IP camera, mobile camera, plate OCR). Stopped for now: its routes are not registered.
    CAMERA_ENABLED: bool = False
    CORS_ALLOW_ORIGIN_REGEX: str = r"^(https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?|https://carecar\.online|https://www\.carecar\.online|https://[a-z0-9-]+\.vercel\.app)$"

    model_config = {"env_file": ".env"}

settings = Settings()
