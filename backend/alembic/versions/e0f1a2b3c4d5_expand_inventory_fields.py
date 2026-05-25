"""expand inventory fields

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
Create Date: 2026-05-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e0f1a2b3c4d5"
down_revision: Union[str, None] = "d9e0f1a2b3c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("inventory", "oil_type", existing_type=sa.String(length=30), type_=sa.String(length=120), existing_nullable=False)
    op.add_column("inventory", sa.Column("category", sa.String(length=80), nullable=True))
    op.add_column("inventory", sa.Column("supplier_name", sa.String(length=160), nullable=True))
    op.add_column("inventory", sa.Column("sale_price", sa.Numeric(12, 2), nullable=True))
    op.add_column("inventory", sa.Column("total_sold", sa.Numeric(10, 2), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("inventory", "total_sold")
    op.drop_column("inventory", "sale_price")
    op.drop_column("inventory", "supplier_name")
    op.drop_column("inventory", "category")
    op.alter_column("inventory", "oil_type", existing_type=sa.String(length=120), type_=sa.String(length=30), existing_nullable=False)
