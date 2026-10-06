"""merge heads and add columns the models had but no migration created

Revision ID: j5k6l7m8n9o0
Revises: b5c6d7e8f9a0, i4j5k6l7m8n9
Create Date: 2026-10-06 22:00:00.000000
"""
from alembic import op


revision = "j5k6l7m8n9o0"
down_revision = ("b5c6d7e8f9a0", "i4j5k6l7m8n9")
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_request_plan VARCHAR(20)")
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_request_ref VARCHAR(100)")
    op.execute("ALTER TABLE cars ADD COLUMN IF NOT EXISTS car_color VARCHAR(30)")
    op.execute("ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS reminder_type VARCHAR(20) NOT NULL DEFAULT 'pre_reminder'")


def downgrade():
    op.execute("ALTER TABLE message_logs DROP COLUMN IF EXISTS reminder_type")
    op.execute("ALTER TABLE cars DROP COLUMN IF EXISTS car_color")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS subscription_request_ref")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS subscription_request_plan")
