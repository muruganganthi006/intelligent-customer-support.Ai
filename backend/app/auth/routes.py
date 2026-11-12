
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.user import User
from app.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.auth.dependencies import (
    get_db,
    get_current_user,
    get_current_admin,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = str(data.email).strip().lower()
    full_name = data.full_name.strip()

    if len(full_name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Full name must contain at least 2 characters",
        )

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    new_user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(data.password),
        role="customer",
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=TokenResponse)
def login_user(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    email = str(data.email).strip().lower()

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(
        data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated",
        )

    access_token = create_access_token(
        user_id=user.id,
        role=user.role,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get("/admin-only")
def admin_only(
    current_admin: User = Depends(get_current_admin),
):
    return {
        "message": "Admin access verified successfully",
        "admin_name": current_admin.full_name,
        "admin_email": current_admin.email,
        "role": current_admin.role,
    }
