import re
import time
import threading
from datetime import date, datetime, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, case
import models
import schemas

US_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
}

STATE_NAME_MAP = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
    "wisconsin": "WI", "wyoming": "WY", "district of columbia": "DC"
}

ABBR_TO_STATE_NAME = {v: k.title() for k, v in STATE_NAME_MAP.items()}

# In-memory anchor date cache to avoid querying func.max(message_time) repeatedly on every request
_anchor_lock = threading.Lock()
_anchor_cache = (0.0, None)


def get_anchor_date(db: Session, force_refresh: bool = False) -> date:
    global _anchor_cache
    now = time.time()
    if not force_refresh and _anchor_cache[1] is not None and (now - _anchor_cache[0]) < 120:
        return _anchor_cache[1]

    with _anchor_lock:
        if not force_refresh and _anchor_cache[1] is not None and (time.time() - _anchor_cache[0]) < 120:
            return _anchor_cache[1]
        try:
            max_dt = db.query(func.max(models.Lead.message_time)).scalar()
            anchor = max_dt.date() if max_dt else datetime.now(timezone.utc).date()
            _anchor_cache = (time.time(), anchor)
            return anchor
        except Exception:
            if _anchor_cache[1] is not None:
                return _anchor_cache[1]
            return datetime.now(timezone.utc).date()


def clear_anchor_cache():
    global _anchor_cache
    with _anchor_lock:
        _anchor_cache = (0.0, None)


def resolve_date_range(db: Session, range_str: Optional[str], start_date: Optional[date], end_date: Optional[date]):
    if start_date or end_date:
        return start_date, end_date
    if not range_str or range_str in ("all", "custom"):
        return None, None

    anchor = get_anchor_date(db)

    range_lower = range_str.lower().strip()
    if range_lower in ("7d", "7 days", "7"):
        return anchor - timedelta(days=6), anchor
    elif range_lower in ("30d", "30 days", "30"):
        return anchor - timedelta(days=29), anchor
    elif range_lower in ("90d", "90 days", "90"):
        return anchor - timedelta(days=89), anchor
    elif range_lower in ("year", "this year", "1y"):
        return date(anchor.year, 1, 1), anchor

    return None, None



def extract_state(area_city: Optional[str]) -> str:
    if not area_city:
        return "Unknown"
    # 1. Look for 2-letter uppercase state abbreviation
    words = re.findall(r'\b([A-Z]{2})\b', area_city)
    for word in words:
        if word in US_STATES:
            return word
    # 2. Check for full state names (case-insensitive)
    lower = area_city.lower()
    for state_name, abbr in STATE_NAME_MAP.items():
        if state_name in lower:
            return abbr
    return "Unknown"


def apply_date_filter(query, model_field, start_date: Optional[date], end_date: Optional[date]):
    if start_date:
        query = query.filter(model_field >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(model_field <= datetime.combine(end_date, datetime.max.time()))
    return query


def get_kpis(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> schemas.KPIResponse:
    anchor = get_anchor_date(db)

    # Use single SQL aggregate query instead of loading all ORM records over the wire!
    q = db.query(
        func.count(models.Lead.id),
        func.count(case((func.trim(func.lower(models.Lead.type_of_lead)) == 'seller', 1))),
        func.count(case((func.trim(func.lower(models.Lead.type_of_lead)) == 'buyer', 1))),
        func.count(case((func.date(models.Lead.message_time) == anchor, 1))),
        func.count(case((
            models.Lead.number.isnot(None) & (func.trim(models.Lead.number) != ''),
            1
        ))),
        func.count(case((
            (models.Lead.name.is_(None) | (func.trim(models.Lead.name) == '')) &
            (models.Lead.number.is_(None) | (func.trim(models.Lead.number) == '')) &
            (models.Lead.email.is_(None) | (func.trim(models.Lead.email) == '')),
            1
        )))
    )
    q = apply_date_filter(q, models.Lead.message_time, start_date, end_date)
    total, sellers, buyers, todays, with_phone, missing = q.first()

    return schemas.KPIResponse(
        total_leads=total or 0,
        seller_leads=sellers or 0,
        buyer_leads=buyers or 0,
        todays_leads=todays or 0,
        leads_with_phone=with_phone or 0,
        missing_contact=missing or 0,
    )


def get_daily_trend(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[schemas.DailyTrendItem]:
    day_expr = func.date(models.Lead.message_time)
    q = db.query(
        day_expr.label("day"),
        func.count(models.Lead.id).label("cnt")
    ).filter(models.Lead.message_time.isnot(None))
    q = apply_date_filter(q, models.Lead.message_time, start_date, end_date)
    rows = q.group_by(day_expr).order_by(day_expr).all()
    return [schemas.DailyTrendItem(date=str(r.day), count=r.cnt) for r in rows]


def get_leads_by_type(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[schemas.LeadByTypeItem]:
    q = db.query(
        models.Lead.type_of_lead,
        func.count(models.Lead.id).label("cnt")
    )
    q = apply_date_filter(q, models.Lead.message_time, start_date, end_date)
    rows = q.group_by(models.Lead.type_of_lead).order_by(func.count(models.Lead.id).desc()).all()
    total = sum(r.cnt for r in rows)
    return [
        schemas.LeadByTypeItem(
            type=r.type_of_lead or "Unknown",
            count=r.cnt,
            percentage=round(r.cnt / total * 100, 1) if total else 0.0
        )
        for r in rows
    ]


def get_leads_by_property(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[schemas.LeadByPropertyItem]:
    q = db.query(
        models.Lead.type_of_property,
        func.count(models.Lead.id).label("cnt")
    ).filter(models.Lead.type_of_property.isnot(None), models.Lead.type_of_property != "")
    q = apply_date_filter(q, models.Lead.message_time, start_date, end_date)
    rows = q.group_by(models.Lead.type_of_property).order_by(func.count(models.Lead.id).desc()).limit(10).all()

    total = sum(r.cnt for r in rows) or 1

    return [
        schemas.LeadByPropertyItem(
            property_type=(r.type_of_property or "Unknown").strip(),
            count=r.cnt,
            percentage=round(r.cnt / total * 100, 1) if total else 0.0
        )
        for r in rows
    ]


def get_leads_by_state(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[schemas.LeadByStateItem]:
    # Group by area_city directly in SQL to transfer ~50 rows instead of ~1500 across the internet
    q = db.query(models.Lead.area_city, func.count(models.Lead.id).label("cnt"))
    q = apply_date_filter(q, models.Lead.message_time, start_date, end_date)
    rows = q.group_by(models.Lead.area_city).all()
    state_counts: dict = {}
    for city, cnt in rows:
        st = extract_state(city)
        state_counts[st] = state_counts.get(st, 0) + cnt
    sorted_states = sorted(state_counts.items(), key=lambda x: x[1], reverse=True)
    return [schemas.LeadByStateItem(state=s, count=c) for s, c in sorted_states]


def get_top_lead_by(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[schemas.TopLeadByItem]:
    q = db.query(
        models.Lead.lead_by_cleaned,
        func.count(models.Lead.id).label("cnt")
    ).filter(models.Lead.lead_by_cleaned.isnot(None), models.Lead.lead_by_cleaned != "")
    q = apply_date_filter(q, models.Lead.message_time, start_date, end_date)
    rows = q.group_by(models.Lead.lead_by_cleaned).order_by(func.count(models.Lead.id).desc()).limit(10).all()
    return [schemas.TopLeadByItem(lead_by_cleaned=r.lead_by_cleaned, count=r.cnt) for r in rows]


def get_recent_leads(db: Session, limit: int = 5) -> List[schemas.LeadResponse]:
    rows = db.query(models.Lead).order_by(models.Lead.message_time.desc()).limit(limit).all()
    return [schemas.LeadResponse.model_validate(r) for r in rows]


def get_last_sync(db: Session) -> Optional[schemas.SyncHistoryResponse]:
    row = db.query(models.SyncHistory).order_by(models.SyncHistory.sync_time.desc()).first()
    if row:
        return schemas.SyncHistoryResponse.model_validate(row)
    return None


def get_employees(db: Session) -> List[str]:
    rows = db.query(
        models.Lead.lead_by_cleaned,
        func.count(models.Lead.id)
    ).filter(
        models.Lead.lead_by_cleaned.isnot(None),
        models.Lead.lead_by_cleaned != ""
    ).group_by(models.Lead.lead_by_cleaned).order_by(
        func.count(models.Lead.id).desc()
    ).all()
    return [r[0] for r in rows if r[0]]


def get_employee_daily_trend(
    db: Session,
    employee: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[schemas.DailyTrendItem]:
    day_expr = func.date(models.Lead.message_time)
    q = db.query(
        day_expr.label("day"),
        func.count(models.Lead.id).label("cnt")
    ).filter(models.Lead.message_time.isnot(None))
    
    if employee and employee != "All" and employee.strip() != "":
        q = q.filter(models.Lead.lead_by_cleaned == employee.strip())
        
    q = apply_date_filter(q, models.Lead.message_time, start_date, end_date)
    rows = q.group_by(day_expr).order_by(day_expr).all()
    return [schemas.DailyTrendItem(date=str(r.day), count=r.cnt) for r in rows]


def get_leads_by_state_table(db: Session) -> List[schemas.StateTableRow]:
    anchor = get_anchor_date(db)
    target_year = anchor.year
    target_month = anchor.month
    target_day = anchor

    rows = db.query(models.Lead.area_city, models.Lead.message_time).all()
    stats = {}
    for ac, mt in rows:
        st = extract_state(ac)
        if st not in stats:
            stats[st] = {"total": 0, "month": 0, "today": 0}
        stats[st]["total"] += 1
        if mt:
            dt = mt.date()
            if dt.year == target_year and dt.month == target_month:
                stats[st]["month"] += 1
            if dt == target_day:
                stats[st]["today"] += 1

    sorted_states = sorted(stats.items(), key=lambda x: x[1]["total"], reverse=True)
    return [
        schemas.StateTableRow(
            state=s,
            state_name=ABBR_TO_STATE_NAME.get(s, "Unknown" if s == "Unknown" else s),
            total_leads=d["total"],
            month_leads=d["month"],
            today_leads=d["today"]
        )
        for s, d in sorted_states
    ]

