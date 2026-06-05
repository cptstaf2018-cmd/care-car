"""add tenant specialty configured

Revision ID: i4j5k6l7m8n9
Revises: h3i4j5k6l7m8
Create Date: 2026-06-05 13:20:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "i4j5k6l7m8n9"
down_revision = "h3i4j5k6l7m8"
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade():
    if not _has_column("tenants", "specialty_configured"):
        op.add_column(
            "tenants",
            sa.Column("specialty_configured", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    op.alter_column("tenants", "specialty_configured", server_default=None)


def downgrade():
    if _has_column("tenants", "specialty_configured"):
        op.drop_column("tenants", "specialty_configured")
