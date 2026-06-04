"""add tenant specialty

Revision ID: h3i4j5k6l7m8
Revises: g2h3i4j5k6l7
Create Date: 2026-06-03 13:35:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "h3i4j5k6l7m8"
down_revision = "g2h3i4j5k6l7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tenants",
        sa.Column("specialty", sa.String(length=40), nullable=False, server_default="quick_service"),
    )
    op.alter_column("tenants", "specialty", server_default=None)


def downgrade():
    op.drop_column("tenants", "specialty")
