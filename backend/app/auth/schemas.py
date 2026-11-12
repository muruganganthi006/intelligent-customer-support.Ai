
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )


class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=1,
        max_length=128
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    role: Literal["customer", "agent", "admin"]

    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
