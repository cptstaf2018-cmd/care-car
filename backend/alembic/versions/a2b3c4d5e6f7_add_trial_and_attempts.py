"""add trial_ends_at and activation_attempts

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-05-28
"""
from alembic import op
import sqlalchemy as sa

revision = 'a2b3c4d5e6f7'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('tenants', sa.Column('trial_ends_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('activation_attempts', sa.SmallInteger(), nullable=False, server_default='0'))

def downgrade():
    op.drop_column('tenants', 'trial_ends_at')
    op.drop_column('users', 'activation_attempts')
