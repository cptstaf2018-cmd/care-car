from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FIRST_SUPERADMIN_EMAIL: str = "admin@oil.com"
    FIRST_SUPERADMIN_PASSWORD: str = "Admin1234!"

    model_config = {"env_file": ".env"}

settings = Settings()
