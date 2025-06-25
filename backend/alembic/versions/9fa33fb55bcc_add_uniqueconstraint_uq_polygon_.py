"""add UniqueConstraint uq_polygon_targetdate

Revision ID: 9fa33fb55bcc
Revises: 7e20da11496f
Create Date: 2025-06-25 15:41:17.230814

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fa33fb55bcc'
down_revision: Union[str, None] = '7e20da11496f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("image_get_logs", schema=None) as batch_op:
        batch_op.create_unique_constraint("uq_polygon_targetdate", ["polygon_uuid", "target_date"])

def downgrade() -> None:
    with op.batch_alter_table("image_get_logs", schema=None) as batch_op:
        batch_op.drop_constraint("uq_polygon_targetdate", type_="unique")
