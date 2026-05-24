"""fix_min_threshold_nullable

Revision ID: a1b2c3d4e5f6
Revises: 00112a3eaafb
Create Date: 2026-05-24 04:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '00112a3eaafb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Set any existing NULLs to the default before making NOT NULL
    op.execute("UPDATE inventory SET min_threshold = 10 WHERE min_threshold IS NULL")
    op.alter_column('inventory', 'min_threshold', nullable=False)


def downgrade() -> None:
    op.alter_column('inventory', 'min_threshold', nullable=True)
