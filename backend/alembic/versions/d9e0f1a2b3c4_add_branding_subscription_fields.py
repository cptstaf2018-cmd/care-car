"""add branding and subscription fields

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2026-05-24 06:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d9e0f1a2b3c4"
down_revision: Union[str, None] = "c8d9e0f1a2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("logo_url", sa.String(length=500), nullable=True))
    op.add_column("tenants", sa.Column("subscription_starts_at", sa.Date(), nullable=True))
    op.add_column("tenants", sa.Column("subscription_ends_at", sa.Date(), nullable=True))
    op.add_column("tenants", sa.Column("subscription_notes", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("tenants", "subscription_notes")
    op.drop_column("tenants", "subscription_ends_at")
    op.drop_column("tenants", "subscription_starts_at")
    op.drop_column("tenants", "logo_url")
