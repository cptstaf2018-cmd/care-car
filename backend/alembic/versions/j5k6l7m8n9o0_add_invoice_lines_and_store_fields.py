"""add invoice lines and store fields

Revision ID: j5k6l7m8n9o0
Revises: i4j5k6l7m8n9
Create Date: 2026-06-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "j5k6l7m8n9o0"
down_revision: Union[str, None] = "i4j5k6l7m8n9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def _tables() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return set(inspector.get_table_names())


def upgrade() -> None:
    tables = _tables()

    if "cars" in tables and "car_color" not in _columns("cars"):
        op.add_column("cars", sa.Column("car_color", sa.String(length=30), nullable=True))

    if "tenants" in tables:
        tenant_columns = _columns("tenants")
        if "subscription_request_plan" not in tenant_columns:
            op.add_column("tenants", sa.Column("subscription_request_plan", sa.String(length=20), nullable=True))
        if "subscription_request_ref" not in tenant_columns:
            op.add_column("tenants", sa.Column("subscription_request_ref", sa.String(length=100), nullable=True))

    if "inventory" in tables:
        inventory_columns = _columns("inventory")
        if "sku" not in inventory_columns:
            op.add_column("inventory", sa.Column("sku", sa.String(length=80), nullable=True))
        if "barcode" not in inventory_columns:
            op.add_column("inventory", sa.Column("barcode", sa.String(length=120), nullable=True))
        if "product_category" not in inventory_columns:
            op.add_column("inventory", sa.Column("product_category", sa.String(length=80), nullable=True))

    if "invoice_lines" not in tables:
        op.create_table(
            "invoice_lines",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tenant_id", sa.Integer(), nullable=False),
            sa.Column("invoice_id", sa.Integer(), nullable=False),
            sa.Column("inventory_item_id", sa.Integer(), nullable=True),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("sku", sa.String(length=80), nullable=True),
            sa.Column("category", sa.String(length=80), nullable=True),
            sa.Column("quantity", sa.Numeric(10, 2), server_default="1", nullable=False),
            sa.Column("unit_price", sa.Numeric(12, 2), server_default="0", nullable=False),
            sa.Column("line_total", sa.Numeric(12, 2), server_default="0", nullable=False),
            sa.Column("notes", sa.String(length=300), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["inventory_item_id"], ["inventory.id"]),
            sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"]),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_invoice_lines_tenant_id"), "invoice_lines", ["tenant_id"], unique=False)
        op.create_index(op.f("ix_invoice_lines_invoice_id"), "invoice_lines", ["invoice_id"], unique=False)
        op.create_index(op.f("ix_invoice_lines_inventory_item_id"), "invoice_lines", ["inventory_item_id"], unique=False)


def downgrade() -> None:
    tables = _tables()
    if "invoice_lines" in tables:
        op.drop_index(op.f("ix_invoice_lines_inventory_item_id"), table_name="invoice_lines")
        op.drop_index(op.f("ix_invoice_lines_invoice_id"), table_name="invoice_lines")
        op.drop_index(op.f("ix_invoice_lines_tenant_id"), table_name="invoice_lines")
        op.drop_table("invoice_lines")

    if "inventory" in tables:
        inventory_columns = _columns("inventory")
        for column in ("product_category", "barcode", "sku"):
            if column in inventory_columns:
                op.drop_column("inventory", column)
