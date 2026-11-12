
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    CheckConstraint,
)

from app.database import Base


class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "role IN ('customer', 'agent', 'admin')",
            name="check_valid_user_role",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(120), nullable=False)

    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password = Column(String(255), nullable=False)

    role = Column(
        String(20),
        default="customer",
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    def __repr__(self):
        return (
            f"<User(id={self.id}, "
            f"email='{self.email}', "
            f"role='{self.role}')>"
        )
