"""legacy debt auto reminder enabled

Revision ID: b4c5d6e7f8a9
Revises: a4b5c6d7e8f9
Create Date: 2026-06-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b4c5d6e7f8a9"
down_revision: Union[str, None] = "a4b5c6d7e8f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    if not _has_column("debts", "auto_reminder_enabled"):
        op.add_column(
            "debts",
            sa.Column("auto_reminder_enabled", sa.Boolean(), server_default=sa.true(), nullable=False),
        )


def downgrade() -> None:
    if _has_column("debts", "auto_reminder_enabled"):
        op.drop_column("debts", "auto_reminder_enabled")
