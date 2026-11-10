
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr


class TicketCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    subject: str
    message: str
    priority: Literal["Low", "Medium", "High"] = "Medium"


class TicketUpdate(BaseModel):
    subject: str | None = None
    message: str | None = None
    status: Literal["Open", "In Progress", "Resolved", "Closed"] | None = None
    priority: Literal["Low", "Medium", "High"] | None = None


class TicketResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: EmailStr
    subject: str
    message: str
    status: str
    priority: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
