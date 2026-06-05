"""decouple sale invoices from car and service

Revision ID: k6l7m8n9o0p1
Revises: j5k6l7m8n9o0
Create Date: 2026-06-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "k6l7m8n9o0p1"
down_revision: Union[str, Sequence[str], None] = "j5k6l7m8n9o0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    invoice_columns = _columns("invoices")
    if "invoice_type" not in invoice_columns:
        op.add_column("invoices", sa.Column("invoice_type", sa.String(length=20), server_default="service", nullable=False))
    if "customer_name" not in invoice_columns:
        op.add_column("invoices", sa.Column("customer_name", sa.String(length=120), nullable=True))
    if "customer_phone" not in invoice_columns:
        op.add_column("invoices", sa.Column("customer_phone", sa.String(length=40), nullable=True))
    op.alter_column("invoices", "service_id", existing_type=sa.Integer(), nullable=True)

    debt_columns = _columns("debts")
    if "customer_name" not in debt_columns:
        op.add_column("debts", sa.Column("customer_name", sa.String(length=120), nullable=True))
    if "customer_phone" not in debt_columns:
        op.add_column("debts", sa.Column("customer_phone", sa.String(length=40), nullable=True))
    op.alter_column("debts", "car_id", existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    op.alter_column("debts", "car_id", existing_type=sa.Integer(), nullable=False)
    for column in ("customer_phone", "customer_name"):
        if column in _columns("debts"):
            op.drop_column("debts", column)

    op.alter_column("invoices", "service_id", existing_type=sa.Integer(), nullable=False)
    for column in ("customer_phone", "customer_name", "invoice_type"):
        if column in _columns("invoices"):
            op.drop_column("invoices", column)
