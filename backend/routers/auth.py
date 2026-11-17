from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from database import get_db
import models
import schemas
from auth import verify_password, hash_password, generate_session_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=schemas.LoginResponse)
def login(
    req: schemas.LoginRequest,
    raw_request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with work email and password.
    Returns session token and user profile on success.
    """
    clean_email = req.email.strip().lower()
    user = db.query(models.User).filter(models.User.email.ilike(clean_email)).first()

    client_ip = raw_request.client.host if raw_request.client else "127.0.0.1"

    if not user:
        try:
            fail_log = models.UserActivityLog(
                user_id=None,
                user_name=clean_email,
                action="LOGIN_UNREGISTERED",
                details=f"Unregistered email login attempt: {clean_email}",
                ip_address=client_ip
            )
            db.add(fail_log)
            db.commit()
        except Exception:
            db.rollback()

        raise HTTPException(
            status_code=404,
            detail="Sorry, you are not registered. Email at huzaifa.bin.saeed5@gmail.com for access."
        )

    if hasattr(user, "is_active") and user.is_active is False:
        raise HTTPException(
            status_code=403,
            detail="Your account is currently inactive. Please contact your system administrator."
        )

    if not user.password_hash or not verify_password(req.password, user.password_hash):
        # Log failed attempt
        fail_log = models.UserActivityLog(
            user_id=user.id,
            user_name=user.name,
            action="LOGIN_FAILED",
            details="Invalid password attempt",
            ip_address=client_ip
        )
        db.add(fail_log)
        db.commit()
        raise HTTPException(
            status_code=401,
            detail="Invalid work email or password. Please verify your credentials."
        )

    now = datetime.utcnow()
    user.is_online = True
    user.last_login = now
    user.last_heartbeat = now
    user.last_active_page = "/dashboard"

    # Log successful login
    success_log = models.UserActivityLog(
        user_id=user.id,
        user_name=user.name,
        action="LOGIN",
        details="User signed in to sales workspace",
        ip_address=client_ip
    )
    db.add(success_log)
    db.commit()
    db.refresh(user)

    token = generate_session_token(user.id)

    user_resp = schemas.UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department=user.department,
        avatar_color=user.avatar_color,
        is_online=user.is_online,
        last_heartbeat=user.last_heartbeat,
        last_login=user.last_login,
        last_seen=user.last_seen,
        last_active_page=user.last_active_page,
        seconds_since_heartbeat=0
    )

    return schemas.LoginResponse(
        success=True,
        token=token,
        user=user_resp,
        message=f"Welcome back, {user.name}!"
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(
    user_id: Optional[int] = None,
    email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Fetch current authenticated user profile."""
    query = db.query(models.User)
    if user_id:
        user = query.filter(models.User.id == user_id).first()
    elif email:
        user = query.filter(models.User.email.ilike(email.strip())).first()
    else:
        # Fallback to primary admin Huzaifa Saeed
        user = query.filter(models.User.id == 1).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return schemas.UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department=user.department,
        avatar_color=user.avatar_color,
        is_online=user.is_online,
        last_heartbeat=user.last_heartbeat,
        last_login=user.last_login,
        last_seen=user.last_seen,
        last_active_page=user.last_active_page,
        seconds_since_heartbeat=0
    )


@router.post("/forgot-password")
def forgot_password(
    req: schemas.ForgotPasswordRequest,
    raw_request: Request,
    db: Session = Depends(get_db)
):
    """
    Secure password reset flow for authorized ISA team members.
    Notifies team administrator.
    """
    clean_email = req.email.strip().lower()
    user = db.query(models.User).filter(models.User.email.ilike(clean_email)).first()
    client_ip = raw_request.client.host if raw_request.client else "127.0.0.1"

    if user:
        reset_log = models.UserActivityLog(
            user_id=user.id,
            user_name=user.name,
            action="PASSWORD_RESET_REQUESTED",
            details=f"Password reset requested for {user.email}",
            ip_address=client_ip
        )
        db.add(reset_log)
        db.commit()

    return {
        "success": True,
        "message": f"Password reset request logged for {clean_email}. Please contact your administrator via email at huzaifa.bin.saeed5@gmail.com to complete password verification."
    }


@router.post("/logout")
def logout(
    raw_request: Request,
    user_id: Optional[int] = None,
    email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Mark session offline and log out."""
    client_ip = raw_request.client.host if raw_request.client else "127.0.0.1"
    query = db.query(models.User)
    if user_id:
        user = query.filter(models.User.id == user_id).first()
    elif email:
        user = query.filter(models.User.email.ilike(email.strip())).first()
    else:
        user = query.filter(models.User.id == 1).first()

    if user:
        now = datetime.utcnow()
        user.is_online = False
        user.last_seen = now
        logout_log = models.UserActivityLog(
            user_id=user.id,
            user_name=user.name,
            action="LOGOUT",
            details="User signed out",
            ip_address=client_ip
        )
        db.add(logout_log)
        db.commit()

    return {"success": True, "message": "Signed out successfully"}

