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
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Care Car"
    PUBLIC_BASE_URL: str = "https://carecar.online"

    model_config = {"env_file": ".env"}

settings = Settings()
