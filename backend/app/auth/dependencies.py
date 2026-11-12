
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.user import User
from app.auth.security import decode_access_token

import jwt


# OAuth2 token configuration
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)


# Database dependency
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# Identify the currently authenticated user
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)

        user_id = int(payload.get("sub"))

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise unauthorized

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise unauthorized

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated"
        )

    return user


# Restrict access based on user roles
def require_roles(*allowed_roles: str):

    def role_checker(
        current_user: User = Depends(get_current_user)
    ):

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )

        return current_user

    return role_checker


# Role-specific dependencies
get_current_customer = require_roles("customer")

get_current_agent = require_roles("agent")

get_current_admin = require_roles("admin")

get_current_staff = require_roles("agent", "admin")
