from app.core.config import Settings


def test_settings_ignores_evolution_container_only_env(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./test.db")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("AUTHENTICATION_API_KEY", "container-only-key")

    settings = Settings(_env_file=None)

    assert settings.DATABASE_URL == "sqlite:///./test.db"
    assert settings.SECRET_KEY == "test-secret"
