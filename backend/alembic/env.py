import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.models.base import Base
from app.models import Tenant, Plan, User, Role, Car, Service, Invoice, InvoiceStatus, InvoiceLine, Debt, InventoryItem, MessageLog, PlatformAd, PlatformPaymentSettings  # noqa

config = context.config
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
if config.config_file_name:
    fileConfig(config.config_file_name)
target_metadata = Base.metadata

def run_migrations_online():
    connectable = engine_from_config(
        config.config_ini_section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=os.environ["DATABASE_URL"],
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()
