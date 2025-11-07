"""Rename position to role in User

Revision ID: 098ba3e4e756
Revises: e5222829a0c6
Create Date: 2025-10-24 10:31:07.976994

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '098ba3e4e756'
down_revision: Union[str, Sequence[str], None] = 'e5222829a0c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
