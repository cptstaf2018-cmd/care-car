import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.models import Tenant, Plan, User, Role, Car, Service, Invoice, InvoiceStatus, Debt, InventoryItem  # noqa
from app.core.security import hash_password

TEST_DB = "sqlite:///./test.db"
engine = create_engine(TEST_DB, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestSession()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_db():
        yield db
    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def superadmin(db):
    u = User(email="admin@test.com", hashed_password=hash_password("pass123"), role=Role.superadmin, full_name="Admin")
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

@pytest.fixture
def superadmin_token(client, superadmin):
    r = client.post("/auth/login", json={"email": "admin@test.com", "password": "pass123"})
    return r.json()["access_token"]
