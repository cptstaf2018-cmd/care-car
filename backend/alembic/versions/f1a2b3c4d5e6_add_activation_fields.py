"""add activation fields

Revision ID: f1a2b3c4d5e6
Revises: e0f1a2b3c4d5
Create Date: 2026-05-28
"""
from alembic import op
import sqlalchemy as sa

revision = 'f1a2b3c4d5e6'
down_revision = 'e0f1a2b3c4d5'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('activation_code', sa.String(6), nullable=True))
    op.add_column('users', sa.Column('activation_expires_at', sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column('users', 'activation_expires_at')
    op.drop_column('users', 'activation_code')
    op.drop_column('users', 'is_verified')
