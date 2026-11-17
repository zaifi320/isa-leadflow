from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
import crud
import schemas
from database import get_db, safe_db_call
from cache import cache

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=schemas.KPIResponse)
def get_kpis(
    range: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    cache_key = f"kpis:{range}:{start_date}:{end_date}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    s_date, e_date = safe_db_call(crud.resolve_date_range, db, range, start_date, end_date)
    result = safe_db_call(crud.get_kpis, db, s_date, e_date)
    cache.set(cache_key, result)
    return result


@router.get("/daily-trend", response_model=List[schemas.DailyTrendItem])
def get_daily_trend(
    range: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    cache_key = f"daily-trend:{range}:{start_date}:{end_date}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    s_date, e_date = safe_db_call(crud.resolve_date_range, db, range, start_date, end_date)
    result = safe_db_call(crud.get_daily_trend, db, s_date, e_date)
    cache.set(cache_key, result)
    return result


@router.get("/leads-by-type", response_model=List[schemas.LeadByTypeItem])
def get_leads_by_type(
    range: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    cache_key = f"leads-by-type:{range}:{start_date}:{end_date}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    s_date, e_date = safe_db_call(crud.resolve_date_range, db, range, start_date, end_date)
    result = safe_db_call(crud.get_leads_by_type, db, s_date, e_date)
    cache.set(cache_key, result)
    return result


@router.get("/leads-by-property", response_model=List[schemas.LeadByPropertyItem])
def get_leads_by_property(
    range: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    cache_key = f"leads-by-property:{range}:{start_date}:{end_date}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    s_date, e_date = safe_db_call(crud.resolve_date_range, db, range, start_date, end_date)
    result = safe_db_call(crud.get_leads_by_property, db, s_date, e_date)
    cache.set(cache_key, result)
    return result


@router.get("/leads-by-state", response_model=List[schemas.LeadByStateItem])
def get_leads_by_state(
    range: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    cache_key = f"leads-by-state:{range}:{start_date}:{end_date}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    s_date, e_date = safe_db_call(crud.resolve_date_range, db, range, start_date, end_date)
    result = safe_db_call(crud.get_leads_by_state, db, s_date, e_date)
    cache.set(cache_key, result)
    return result


@router.get("/top-lead-by", response_model=List[schemas.TopLeadByItem])
def get_top_lead_by(
    range: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    cache_key = f"top-lead-by:{range}:{start_date}:{end_date}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    s_date, e_date = safe_db_call(crud.resolve_date_range, db, range, start_date, end_date)
    result = safe_db_call(crud.get_top_lead_by, db, s_date, e_date)
    cache.set(cache_key, result)
    return result


@router.get("/recent-leads", response_model=List[schemas.LeadResponse])
def get_recent_leads(
    limit: int = Query(5, ge=1, le=100),
    db: Session = Depends(get_db)
):
    cache_key = f"recent-leads:{limit}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    result = safe_db_call(crud.get_recent_leads, db, limit)
    cache.set(cache_key, result)
    return result


@router.get("/employees", response_model=List[str])
def get_employees(db: Session = Depends(get_db)):
    cache_key = "employees"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    result = safe_db_call(crud.get_employees, db)
    cache.set(cache_key, result)
    return result


@router.get("/employee-trend", response_model=List[schemas.DailyTrendItem])
def get_employee_trend(
    employee: Optional[str] = Query(None),
    range: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    cache_key = f"employee-trend:{employee}:{range}:{start_date}:{end_date}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    s_date, e_date = safe_db_call(crud.resolve_date_range, db, range, start_date, end_date)
    result = safe_db_call(crud.get_employee_daily_trend, db, employee, s_date, e_date)
    cache.set(cache_key, result)
    return result


@router.get("/leads-by-state-table", response_model=List[schemas.StateTableRow])
def get_leads_by_state_table(db: Session = Depends(get_db)):
    cache_key = "leads-by-state-table"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    result = safe_db_call(crud.get_leads_by_state_table, db)
    cache.set(cache_key, result)
    return result


@router.get("/last-sync", response_model=Optional[schemas.SyncHistoryResponse])
def get_last_sync(db: Session = Depends(get_db)):
    cached = cache.get("last-sync")
    if cached is not None:
        return cached
    result = safe_db_call(crud.get_last_sync, db)
    if result:
        cache.set("last-sync", result, ttl=30)
    return result


def warm_dashboard_cache():
    """
    Background worker that pre-calculates and caches all 4 standard ranges
    ('7d', '30d', '90d', 'year') for all dashboard queries so switching
    ranges in the UI is instantaneous (0ms).
    """
    try:
        from database import SessionLocal
        db = SessionLocal()
        try:
            print("[Cache Warmer] Starting background cache warming for standard ranges...")
            # 1. Warm anchor date and common lists
            anchor = crud.get_anchor_date(db, force_refresh=True)
            employees = crud.get_employees(db)
            cache.set("employees", employees)
            state_table = crud.get_leads_by_state_table(db)
            cache.set("leads-by-state-table", state_table)

            top_employees = employees[:5] if employees else []

            # 2. Warm all 4 standard ranges
            standard_ranges = ["7d", "30d", "90d", "year"]
            for r in standard_ranges:
                s_date, e_date = crud.resolve_date_range(db, r, None, None)

                # KPIs
                kpis = crud.get_kpis(db, s_date, e_date)
                cache.set(f"kpis:{r}:None:None", kpis)

                # Daily Trend
                daily = crud.get_daily_trend(db, s_date, e_date)
                cache.set(f"daily-trend:{r}:None:None", daily)

                # Leads by Type
                ltype = crud.get_leads_by_type(db, s_date, e_date)
                cache.set(f"leads-by-type:{r}:None:None", ltype)

                # Leads by Property
                lprop = crud.get_leads_by_property(db, s_date, e_date)
                cache.set(f"leads-by-property:{r}:None:None", lprop)

                # Leads by State
                lstate = crud.get_leads_by_state(db, s_date, e_date)
                cache.set(f"leads-by-state:{r}:None:None", lstate)

                # Top Lead By
                top_leads = crud.get_top_lead_by(db, s_date, e_date)
                cache.set(f"top-lead-by:{r}:None:None", top_leads)

                # Employee trends for top employees
                for emp in top_employees:
                    emp_trend = crud.get_employee_daily_trend(db, emp, s_date, e_date)
                    cache.set(f"employee-trend:{emp}:{r}:None:None", emp_trend)

            print("[Cache Warmer] All 4 standard dashboard ranges successfully warmed into memory!")
        finally:
            db.close()
    except Exception as e:
        print(f"[Cache Warmer Warning] Could not complete cache warming: {e}")


def trigger_cache_warming_async():
    import threading
    t = threading.Thread(target=warm_dashboard_cache, daemon=True)
    t.start()


@router.post("/sync")
def trigger_sync(db: Session = Depends(get_db)):
    from sync_service import sync_google_sheets
    try:
        result = sync_google_sheets(db)
        # Clear in-memory cache and anchor date cache immediately
        cache.clear()
        crud.clear_anchor_cache()
        trigger_cache_warming_async()
        return result
    except Exception as e:
        # If connection was dropped or idle, rollback and retry once
        print(f"[Sync] Attempt 1 failed ({e}). Reconnecting and retrying...")
        db.rollback()
        try:
            result = sync_google_sheets(db)
            cache.clear()
            crud.clear_anchor_cache()
            trigger_cache_warming_async()
            return result
        except Exception as retry_err:
            print(f"[Sync] Retry failed: {retry_err}")
            return {
                "success": False,
                "status": "error",
                "message": f"Sync failed: {str(retry_err)}",
                "records_synced": 0,
            }


@router.post("/clear-cache")
def clear_cache():
    cache.clear()
    crud.clear_anchor_cache()
    trigger_cache_warming_async()
    return {"success": True, "message": "Cache cleared and warming initiated"}


@router.post("/warm-cache")
def warm_cache_endpoint():
    trigger_cache_warming_async()
    return {"success": True, "message": "Cache warming initiated in background"}
