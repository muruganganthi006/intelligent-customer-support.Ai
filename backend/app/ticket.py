
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.database import Base


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)

    customer_name = Column(String(100), nullable=False)

    customer_email = Column(String(150), nullable=False, index=True)

    subject = Column(String(200), nullable=False)

    message = Column(Text, nullable=False)

    status = Column(String(30), default="Open", nullable=False)

    priority = Column(String(20), default="Medium", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
