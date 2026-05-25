"""add tenant camera and whatsapp settings

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-05-24 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("ip_camera_url", sa.String(length=500), nullable=True))
    op.add_column("tenants", sa.Column("ip_camera_username", sa.String(length=100), nullable=True))
    op.add_column("tenants", sa.Column("ip_camera_password", sa.String(length=200), nullable=True))
    op.add_column("tenants", sa.Column("wasnder_api_key", sa.String(length=300), nullable=True))
    op.add_column("tenants", sa.Column("whatsapp_number", sa.String(length=30), nullable=True))
    op.add_column("tenants", sa.Column("reminder_days", sa.Integer(), nullable=False, server_default="30"))
    op.add_column("tenants", sa.Column("reminder_message_template", sa.String(length=1000), nullable=True))


def downgrade() -> None:
    op.drop_column("tenants", "reminder_message_template")
    op.drop_column("tenants", "reminder_days")
    op.drop_column("tenants", "whatsapp_number")
    op.drop_column("tenants", "wasnder_api_key")
    op.drop_column("tenants", "ip_camera_password")
    op.drop_column("tenants", "ip_camera_username")
    op.drop_column("tenants", "ip_camera_url")
