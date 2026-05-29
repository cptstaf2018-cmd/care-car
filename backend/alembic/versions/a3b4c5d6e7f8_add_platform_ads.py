"""add platform_ads table

Revision ID: a3b4c5d6e7f8
Revises: a2b3c4d5e6f7
Create Date: 2026-05-29
"""
from alembic import op
import sqlalchemy as sa

revision = 'a3b4c5d6e7f8'
down_revision = 'a2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'platform_ads',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('filename', sa.String(300), nullable=False),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('platform_ads')
