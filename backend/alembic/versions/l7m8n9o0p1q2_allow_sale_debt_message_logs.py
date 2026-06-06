"""allow sale debt message logs

Revision ID: l7m8n9o0p1q2
Revises: k6l7m8n9o0p1
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "l7m8n9o0p1q2"
down_revision: Union[str, Sequence[str], None] = "k6l7m8n9o0p1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    message_log_columns = _columns("message_logs")
    op.alter_column("message_logs", "car_id", existing_type=sa.Integer(), nullable=True)
    if "debt_id" not in message_log_columns:
        op.add_column("message_logs", sa.Column("debt_id", sa.Integer(), nullable=True))
        op.create_index("ix_message_logs_debt_id", "message_logs", ["debt_id"])
        op.create_foreign_key(
            "message_logs_debt_id_fkey",
            "message_logs",
            "debts",
            ["debt_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    if "debt_id" in _columns("message_logs"):
        op.drop_constraint("message_logs_debt_id_fkey", "message_logs", type_="foreignkey")
        op.drop_index("ix_message_logs_debt_id", table_name="message_logs")
        op.drop_column("message_logs", "debt_id")
    op.alter_column("message_logs", "car_id", existing_type=sa.Integer(), nullable=False)
