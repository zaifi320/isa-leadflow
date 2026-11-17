from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from typing import Optional, List
from datetime import datetime, timedelta, timezone

from database import get_db
import models
import schemas
from auth import hash_password

router = APIRouter(prefix="/api/users", tags=["User Management & Status"])

HEARTBEAT_TIMEOUT_SECONDS = 90


def _get_utc_now():
    """Return naive UTC datetime matching SQLAlchemy's default func.now() behavior."""
    return datetime.utcnow()


def _reconcile_offline_users(db: Session, now: datetime):
    """
    Evaluates users whose is_online is True. If their last heartbeat was > 90 seconds ago,
    mark them offline and update last_seen to their last_heartbeat timestamp.
    """
    cutoff = now - timedelta(seconds=HEARTBEAT_TIMEOUT_SECONDS)
    stale_users = db.query(models.User).filter(
        models.User.is_online == True,
        or_(
            models.User.last_heartbeat == None,
            models.User.last_heartbeat < cutoff
        )
    ).all()

    for u in stale_users:
        u.is_online = False
        u.last_seen = u.last_heartbeat or now
        # Log session timeout
        timeout_log = models.UserActivityLog(
            user_id=u.id,
            user_name=u.name,
            action="TIMEOUT",
            details=f"Session timed out (no heartbeat for > {HEARTBEAT_TIMEOUT_SECONDS}s)",
            ip_address="system"
        )
        db.add(timeout_log)

    if stale_users:
        db.commit()


@router.get("", response_model=List[schemas.UserResponse])
def get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,  # "online" or "offline"
    requester_role: Optional[str] = Query(None, description="Role of requesting user"),
    db: Session = Depends(get_db)
):
    """
    Fetch all users with dynamic online/offline calculation.
    Only Administrators are permitted to view the User Management directory.
    """
    if requester_role and requester_role.lower() != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Only Administrators have permission to view the User Management directory."
        )
    now = _get_utc_now()
    _reconcile_offline_users(db, now)

    query = db.query(models.User)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.User.name.ilike(search_pattern),
                models.User.email.ilike(search_pattern),
                models.User.department.ilike(search_pattern)
            )
        )

    if role and role.lower() != "all":
        query = query.filter(models.User.role.ilike(role))

    if status:
        if status.lower() == "online":
            query = query.filter(models.User.is_online == True)
        elif status.lower() == "offline":
            query = query.filter(models.User.is_online == False)

    users = query.order_by(models.User.is_online.desc(), models.User.name.asc()).all()

    results = []
    for u in users:
        seconds_since = None
        if u.last_heartbeat:
            diff = (now - u.last_heartbeat).total_seconds()
            seconds_since = max(0, int(diff))

        results.append(schemas.UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            department=u.department,
            avatar_color=u.avatar_color,
            is_online=u.is_online,
            last_heartbeat=u.last_heartbeat,
            last_login=u.last_login,
            last_seen=u.last_seen,
            last_active_page=u.last_active_page,
            seconds_since_heartbeat=seconds_since
        ))

    return results


@router.post("", response_model=schemas.UserResponse)
def create_user(
    user_in: schemas.UserCreate,
    raw_request: Request,
    requester_role: Optional[str] = Query("Admin", description="Role of user creating account"),
    db: Session = Depends(get_db)
):
    """Create a new team user in Neon PostgreSQL. Admin only."""
    if requester_role and requester_role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Only Administrators can create new users.")

    existing = db.query(models.User).filter(models.User.email.ilike(user_in.email.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"User with email '{user_in.email}' already exists.")

    client_ip = raw_request.client.host if raw_request.client else "127.0.0.1"

    raw_pwd = user_in.password.strip() if (user_in.password and user_in.password.strip()) else "Lead@2026"
    new_user = models.User(
        name=user_in.name.strip(),
        email=user_in.email.strip().lower(),
        password_hash=hash_password(raw_pwd),
        is_active=True,
        role=user_in.role or "Agent",
        department=user_in.department or "ISA Sales Team",
        avatar_color=user_in.avatar_color or "#2563eb",
        is_online=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log activity
    log_entry = models.UserActivityLog(
        user_id=new_user.id,
        user_name=new_user.name,
        action="USER_CREATED",
        details=f"New user created ({new_user.role} - {new_user.department})",
        ip_address=client_ip
    )
    db.add(log_entry)
    db.commit()

    return schemas.UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        department=new_user.department,
        avatar_color=new_user.avatar_color,
        is_online=new_user.is_online,
        last_heartbeat=new_user.last_heartbeat,
        last_login=new_user.last_login,
        last_seen=new_user.last_seen,
        last_active_page=new_user.last_active_page,
        seconds_since_heartbeat=None
    )


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    raw_request: Request,
    requester_role: Optional[str] = Query("Admin", description="Role of user deleting account"),
    db: Session = Depends(get_db)
):
    """Delete a user account and record audit log. Admin only."""
    if requester_role and requester_role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Only Administrators can delete users.")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == 1 and user.role.lower() == "admin":
        raise HTTPException(status_code=400, detail="Primary Administrator account cannot be deleted.")

    client_ip = raw_request.client.host if raw_request.client else "127.0.0.1"
    user_name = user.name
    user_role = user.role

    # Nullify user_id in activity logs before deleting user
    db.query(models.UserActivityLog).filter(models.UserActivityLog.user_id == user_id).update({"user_id": None})

    db.delete(user)

    # Record deletion log
    log_entry = models.UserActivityLog(
        user_id=None,
        user_name=user_name,
        action="USER_DELETED",
        details=f"User account '{user_name}' ({user_role}) was removed from portal",
        ip_address=client_ip
    )
    db.add(log_entry)
    db.commit()

    return {"success": True, "message": f"User {user_name} deleted successfully"}


@router.get("/summary", response_model=schemas.UserSummaryResponse)
def get_user_summary(
    requester_role: Optional[str] = Query(None, description="Role of requesting user"),
    db: Session = Depends(get_db)
):
    """
    Get summary statistics:
    - total users
    - online users (active heartbeat within 90s)
    - offline users
    - active today
    """
    if requester_role and requester_role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Only Administrators can view user management summary.")
    now = _get_utc_now()
    _reconcile_offline_users(db, now)

    total_users = db.query(func.count(models.User.id)).scalar() or 0
    online_users = db.query(func.count(models.User.id)).filter(models.User.is_online == True).scalar() or 0
    offline_users = max(0, total_users - online_users)

    today_start = datetime(now.year, now.month, now.day)
    active_today = db.query(func.count(models.User.id)).filter(
        or_(
            models.User.last_heartbeat >= today_start,
            models.User.last_seen >= today_start,
            models.User.last_login >= today_start
        )
    ).scalar() or 0

    return schemas.UserSummaryResponse(
        total_users=total_users,
        online_users=online_users,
        offline_users=offline_users,
        active_today=active_today
    )


@router.post("/heartbeat", response_model=schemas.HeartbeatResponse)
def process_heartbeat(
    request: schemas.HeartbeatRequest,
    raw_request: Request,
    db: Session = Depends(get_db)
):
    """
    Heartbeat received every 30s from active client session.
    Marks user online, updates last_heartbeat, and records page activity.
    """
    now = _get_utc_now()
    client_ip = raw_request.client.host if raw_request.client else "127.0.0.1"

    user = None
    if request.user_id:
        user = db.query(models.User).filter(models.User.id == request.user_id).first()
    elif request.email:
        user = db.query(models.User).filter(models.User.email.ilike(request.email)).first()

    if not user:
        # Fallback to Huzaifa Saeed (Admin default session user)
        user = db.query(models.User).filter(models.User.id == 1).first()

    if user:
        was_offline = not user.is_online
        user.is_online = True
        user.last_heartbeat = now
        user.last_active_page = request.current_page or "/dashboard"
        
        if not user.last_login or was_offline:
            user.last_login = now
            # Log login / active session resume
            log_entry = models.UserActivityLog(
                user_id=user.id,
                user_name=user.name,
                action="ONLINE",
                details=f"Session connected on {request.current_page or 'Dashboard'}",
                ip_address=client_ip
            )
            db.add(log_entry)

        db.commit()

    # Reconcile any other users who may have timed out
    _reconcile_offline_users(db, now)

    online_count = db.query(func.count(models.User.id)).filter(models.User.is_online == True).scalar() or 0

    return schemas.HeartbeatResponse(
        success=True,
        is_online=True,
        server_time=now,
        online_count=online_count
    )


@router.post("/logout")
def process_logout(
    request: schemas.HeartbeatRequest,
    raw_request: Request,
    db: Session = Depends(get_db)
):
    """
    Marks user offline immediately upon logout action and logs the event.
    """
    now = _get_utc_now()
    client_ip = raw_request.client.host if raw_request.client else "127.0.0.1"

    user = None
    if request.user_id:
        user = db.query(models.User).filter(models.User.id == request.user_id).first()
    elif request.email:
        user = db.query(models.User).filter(models.User.email.ilike(request.email)).first()
    else:
        user = db.query(models.User).filter(models.User.id == 1).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_online = False
    user.last_seen = now

    log_entry = models.UserActivityLog(
        user_id=user.id,
        user_name=user.name,
        action="LOGOUT",
        details="User logged out manually from portal",
        ip_address=client_ip
    )
    db.add(log_entry)
    db.commit()

    return {"success": True, "message": f"{user.name} logged out successfully"}


@router.post("/beacon-offline")
def process_beacon_offline(
    request: schemas.HeartbeatRequest,
    raw_request: Request,
    db: Session = Depends(get_db)
):
    """
    Endpoint called by navigator.sendBeacon when tab or window is closing.
    Marks user offline immediately.
    """
    now = _get_utc_now()
    client_ip = raw_request.client.host if raw_request.client else "127.0.0.1"

    user = None
    if request.user_id:
        user = db.query(models.User).filter(models.User.id == request.user_id).first()
    elif request.email:
        user = db.query(models.User).filter(models.User.email.ilike(request.email)).first()
    else:
        user = db.query(models.User).filter(models.User.id == 1).first()

    if user:
        user.is_online = False
        user.last_seen = now
        log_entry = models.UserActivityLog(
            user_id=user.id,
            user_name=user.name,
            action="DISCONNECT",
            details="Browser tab/window closed (beacon)",
            ip_address=client_ip
        )
        db.add(log_entry)
        db.commit()

    return {"success": True}


@router.get("/activity-logs", response_model=schemas.UserActivityLogPagination)
def get_user_activity_logs(
    user_role: str = Query(..., description="Role of current user. Only Admin allowed."),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    search: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Requirement: 'Only Admin should be able to see the complete user activity list.'
    Returns paginated audit trail of user sessions, heartbeats, logouts, and timeouts.
    """
    if user_role.lower() != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Only Administrators can view the complete user activity list."
        )

    query = db.query(models.UserActivityLog)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.UserActivityLog.user_name.ilike(search_pattern),
                models.UserActivityLog.details.ilike(search_pattern),
                models.UserActivityLog.ip_address.ilike(search_pattern)
            )
        )

    if action and action.lower() != "all":
        query = query.filter(models.UserActivityLog.action.ilike(action))

    total = query.count()
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    offset = (page - 1) * limit

    items = query.order_by(desc(models.UserActivityLog.created_at)).offset(offset).limit(limit).all()

    return schemas.UserActivityLogPagination(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

