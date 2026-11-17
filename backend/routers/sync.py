from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timedelta, timezone

from database import get_db, safe_db_call
import models
import schemas
from cache import cache
import crud

router = APIRouter(prefix="/api/sync", tags=["Data Sync"])


@router.get("/summary", response_model=schemas.SyncSummaryResponse)
def get_sync_summary(db: Session = Depends(get_db)):
    cached = cache.get("sync_summary")
    if cached is not None:
        return cached

    # Query all syncs
    total_syncs = db.query(func.count(models.SyncHistory.id)).scalar() or 0
    successful_syncs = db.query(func.count(models.SyncHistory.id)).filter(
        models.SyncHistory.status.in_(["success", "Success"])
    ).scalar() or 0
    failed_syncs = db.query(func.count(models.SyncHistory.id)).filter(
        models.SyncHistory.status.in_(["failed", "error", "Failed", "Error"])
    ).scalar() or 0

    # Last successful sync
    last_success = db.query(models.SyncHistory).filter(
        models.SyncHistory.status.in_(["success", "Success"])
    ).order_by(models.SyncHistory.sync_time.desc()).first()

    # Most recent sync overall
    latest_sync = db.query(models.SyncHistory).order_by(
        models.SyncHistory.sync_time.desc()
    ).first()

    # Sum of new leads and updated leads
    total_new = db.query(func.sum(models.SyncHistory.new_leads)).scalar() or 0
    total_updated = db.query(func.sum(models.SyncHistory.updated_leads)).scalar() or 0

    # Avg duration
    avg_dur = db.query(func.avg(models.SyncHistory.duration_seconds)).filter(
        models.SyncHistory.duration_seconds.isnot(None),
        models.SyncHistory.duration_seconds > 0
    ).scalar() or 2.1

    resp = schemas.SyncSummaryResponse(
        last_successful_sync=last_success.sync_time if last_success else None,
        last_sync_status="Success" if (latest_sync and latest_sync.status in ["success", "Success"]) else ("Failed" if latest_sync else "Success"),
        total_syncs=total_syncs,
        successful_syncs=successful_syncs,
        failed_syncs=failed_syncs,
        total_new_leads=int(total_new),
        total_updated_leads=int(total_updated),
        latest_new_leads=latest_sync.new_leads if latest_sync and latest_sync.new_leads is not None else 0,
        latest_updated_leads=latest_sync.updated_leads if latest_sync and latest_sync.updated_leads is not None else 0,
        avg_duration_seconds=round(float(avg_dur), 1)
    )

    cache.set("sync_summary", resp, ttl=10)
    return resp


@router.get("/history", response_model=schemas.SyncHistoryPagination)
def get_sync_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    range: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(models.SyncHistory)

    if status and status.lower() != "all":
        if status.lower() == "success":
            q = q.filter(models.SyncHistory.status.in_(["success", "Success"]))
        elif status.lower() in ["failed", "error"]:
            q = q.filter(models.SyncHistory.status.in_(["failed", "error", "Failed", "Error"]))

    if range and range != "all":
        now = datetime.now()
        days_map = {"7d": 7, "30d": 30, "90d": 90}
        days = days_map.get(range.lower())
        if days:
            start_dt = now - timedelta(days=days)
            q = q.filter(models.SyncHistory.sync_time >= start_dt)

    if search and search.strip():
        term = f"%{search.strip()}%"
        q = q.filter(
            (models.SyncHistory.source.ilike(term)) |
            (models.SyncHistory.status.ilike(term)) |
            (models.SyncHistory.error_message.ilike(term))
        )

    total = q.count()
    total_pages = max(1, (total + limit - 1) // limit)
    offset = (page - 1) * limit

    rows = q.order_by(models.SyncHistory.sync_time.desc()).offset(offset).limit(limit).all()

    items = []
    for r in rows:
        items.append(schemas.SyncHistoryResponse(
            id=r.id,
            sync_time=r.sync_time,
            start_time=r.start_time or r.sync_time,
            end_time=r.end_time or r.sync_time,
            duration_seconds=r.duration_seconds or 1.8,
            records_processed=r.records_processed or r.records_synced or 0,
            records_synced=r.records_synced or 0,
            new_leads=r.new_leads or 0,
            updated_leads=r.updated_leads or 0,
            status="Success" if r.status in ["success", "Success"] else "Failed",
            error_message=r.error_message,
            source=r.source or "Google Sheets"
        ))

    return schemas.SyncHistoryPagination(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.get("/trend", response_model=List[schemas.SyncTrendItem])
def get_sync_trend(
    range: str = Query("30d"),
    db: Session = Depends(get_db)
):
    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(range.lower(), 30)
    now = datetime.now().date()
    start_date = now - timedelta(days=days - 1)

    # Fetch rows within the date range
    day_expr = func.date(models.SyncHistory.sync_time)
    rows = db.query(
        day_expr.label("day"),
        func.count(models.SyncHistory.id).label("cnt"),
        func.coalesce(func.sum(models.SyncHistory.new_leads), 0).label("new_cnt")
    ).filter(
        models.SyncHistory.sync_time.isnot(None),
        day_expr >= start_date
    ).group_by(day_expr).order_by(day_expr).all()

    # Build date mapping
    date_dict = {str(r.day): {"cnt": r.cnt, "new": int(r.new_cnt)} for r in rows}

    result = []
    # Fill in every day in the interval
    curr = start_date
    while curr <= now:
        d_str = str(curr)
        info = date_dict.get(d_str, {"cnt": 0, "new": 0})
        label = curr.strftime("%b %d")
        result.append(schemas.SyncTrendItem(
            date=d_str,
            label=label,
            count=info["cnt"],
            new_leads=info["new"]
        ))
        curr += timedelta(days=1)

    return result


@router.post("/trigger")
def trigger_sync(db: Session = Depends(get_db)):
    from sync_service import sync_google_sheets
    from routers.dashboard import trigger_cache_warming_async
    try:
        result = sync_google_sheets(db)
        cache.clear()
        crud.clear_anchor_cache()
        trigger_cache_warming_async()
        return result
    except Exception as e:
        db.rollback()
        try:
            result = sync_google_sheets(db)
            cache.clear()
            crud.clear_anchor_cache()
            trigger_cache_warming_async()
            return result
        except Exception as retry_err:
            return {
                "success": False,
                "status": "failed",
                "message": f"Sync failed: {str(retry_err)}",
                "records_processed": 0,
                "records_synced": 0,
                "new_leads_added": 0,
                "updated_leads": 0,
            }

