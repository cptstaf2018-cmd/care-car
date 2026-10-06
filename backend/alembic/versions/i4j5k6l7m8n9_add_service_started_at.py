"""add service started_at (pit-stop timer)

Revision ID: i4j5k6l7m8n9
Revises: h3i4j5k6l7m8
Create Date: 2026-10-06 17:50:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "i4j5k6l7m8n9"
down_revision = "h3i4j5k6l7m8"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("services", sa.Column("started_at", sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column("services", "started_at")
