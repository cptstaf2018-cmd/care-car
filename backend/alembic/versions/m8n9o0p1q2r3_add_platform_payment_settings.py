"""add platform payment settings

Revision ID: m8n9o0p1q2r3
Revises: l7m8n9o0p1q2
Create Date: 2026-06-06 14:35:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "m8n9o0p1q2r3"
down_revision = "l7m8n9o0p1q2"
branch_labels = None
depends_on = None


def _has_column(bind, table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(bind)
    return any(col["name"] == column_name for col in inspector.get_columns(table_name))


def _has_table(bind, table_name: str) -> bool:
    return sa.inspect(bind).has_table(table_name)


def upgrade():
    bind = op.get_bind()
    if not _has_column(bind, "tenants", "subscription_request_method"):
        op.add_column("tenants", sa.Column("subscription_request_method", sa.String(length=20), nullable=True))

    if not _has_table(bind, "platform_payment_settings"):
        op.create_table(
            "platform_payment_settings",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("superkey_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("superkey_account_name", sa.String(length=120), nullable=True),
            sa.Column("superkey_account_id", sa.String(length=120), nullable=True),
            sa.Column("superkey_qr_url", sa.String(length=500), nullable=True),
            sa.Column("superkey_instructions", sa.String(length=700), nullable=True),
            sa.Column("binance_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("binance_account_name", sa.String(length=120), nullable=True),
            sa.Column("binance_account_id", sa.String(length=120), nullable=True),
            sa.Column("binance_qr_url", sa.String(length=500), nullable=True),
            sa.Column("binance_instructions", sa.String(length=700), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.execute(
            """
            INSERT INTO platform_payment_settings (
                id, superkey_enabled, superkey_account_name, superkey_instructions,
                binance_enabled, binance_account_name, binance_instructions, updated_at
            ) VALUES (
                1, TRUE, 'سعد', 'داخل العراق: ادفع عبر سوبر كي ثم أدخل رقم العملية.',
                TRUE, 'Care Car', 'خارج العراق: ادفع عبر Binance Pay ثم أدخل رقم العملية.', CURRENT_TIMESTAMP
            )
            """
        )


def downgrade():
    bind = op.get_bind()
    if _has_table(bind, "platform_payment_settings"):
        op.drop_table("platform_payment_settings")
    if _has_column(bind, "tenants", "subscription_request_method"):
        op.drop_column("tenants", "subscription_request_method")
