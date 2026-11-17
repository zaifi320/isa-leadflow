from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List
from datetime import datetime, date
import csv
import io
import models
import crud
from database import get_db
from cache import cache

router = APIRouter(prefix="/api/leads", tags=["leads"])


def build_leads_query(
    db: Session,
    search: Optional[str] = None,
    type_of_lead: Optional[str] = None,
    type_of_property: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    budget: Optional[str] = None,
    beds: Optional[str] = None,
    baths: Optional[str] = None,
    cash_finance: Optional[str] = None,
    under_contract: Optional[str] = None,
    willing_to_sign: Optional[str] = None,
    lead_by: Optional[str] = None,
    lead_for: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    q = db.query(models.Lead)

    # Date filter
    q = crud.apply_date_filter(q, models.Lead.message_time, start_date, end_date)

    if search and search.strip():
        s = f"%{search.strip()}%"
        q = q.filter(
            or_(
                models.Lead.name.ilike(s),
                models.Lead.number.ilike(s),
                models.Lead.email.ilike(s),
                models.Lead.area_city.ilike(s),
                models.Lead.message_id.ilike(s),
                models.Lead.lead_by_cleaned.ilike(s),
                models.Lead.sender_name.ilike(s),
            )
        )

    if type_of_lead and type_of_lead != "All":
        q = q.filter(func.lower(models.Lead.type_of_lead) == type_of_lead.lower())

    if type_of_property and type_of_property != "All":
        q = q.filter(func.lower(models.Lead.type_of_property).ilike(f"%{type_of_property.lower()}%"))

    if state and state != "All":
        q = q.filter(models.Lead.area_city.ilike(f"%{state}%"))

    if city and city != "All":
        q = q.filter(models.Lead.area_city.ilike(f"%{city}%"))

    if budget and budget not in ("All", "Any Budget", "Any"):
        if budget == "<$200k":
            q = q.filter(models.Lead.budget.ilike("%1%") | models.Lead.budget.ilike("%$1%") | models.Lead.budget.ilike("%<200%"))
        elif budget == "$200k-$500k":
            q = q.filter(models.Lead.budget.ilike("%2%") | models.Lead.budget.ilike("%3%") | models.Lead.budget.ilike("%4%"))
        elif budget == "$500k+":
            q = q.filter(models.Lead.budget.ilike("%5%") | models.Lead.budget.ilike("%6%") | models.Lead.budget.ilike("%7%") | models.Lead.budget.ilike("%8%") | models.Lead.budget.ilike("%9%") | models.Lead.budget.ilike("%1M%"))
        else:
            q = q.filter(models.Lead.budget.ilike(f"%{budget}%"))

    if beds and beds not in ("All", "Any"):
        q = q.filter(models.Lead.beds_baths.ilike(f"%{beds}%bed%") | models.Lead.beds_baths.ilike(f"{beds}/%"))

    if baths and baths not in ("All", "Any"):
        q = q.filter(models.Lead.beds_baths.ilike(f"%{baths}%bath%") | models.Lead.beds_baths.ilike(f"%/{baths}%"))

    if cash_finance and cash_finance != "All":
        q = q.filter(models.Lead.cash_finance.ilike(f"%{cash_finance}%"))

    if under_contract and under_contract != "All":
        q = q.filter(func.lower(models.Lead.under_contract).ilike(f"%{under_contract.lower()}%"))

    if willing_to_sign and willing_to_sign != "All":
        q = q.filter(func.lower(models.Lead.willing_to_sign).ilike(f"%{willing_to_sign.lower()}%"))

    if lead_by and lead_by != "All":
        q = q.filter(models.Lead.lead_by_cleaned == lead_by)

    if lead_for and lead_for != "All":
        q = q.filter(models.Lead.lead_for.ilike(f"%{lead_for}%"))

    return q


@router.get("")
def get_all_leads(
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=200),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("message_time"),
    sort_dir: Optional[str] = Query("desc"),
    type_of_lead: Optional[str] = Query(None),
    type_of_property: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    budget: Optional[str] = Query(None),
    beds: Optional[str] = Query(None),
    baths: Optional[str] = Query(None),
    cash_finance: Optional[str] = Query(None),
    under_contract: Optional[str] = Query(None),
    willing_to_sign: Optional[str] = Query(None),
    lead_by: Optional[str] = Query(None),
    lead_for: Optional[str] = Query(None),
    range: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    s_date, e_date = crud.resolve_date_range(db, range, start_date, end_date)

    q = build_leads_query(
        db, search, type_of_lead, type_of_property,
        state, city, budget, beds, baths, cash_finance,
        under_contract, willing_to_sign, lead_by, lead_for,
        s_date, e_date
    )

    total = q.count()

    sort_col_map = {
        "message_time": models.Lead.message_time,
        "name": models.Lead.name,
        "type_of_lead": models.Lead.type_of_lead,
        "lead_by": models.Lead.lead_by_cleaned,
        "budget": models.Lead.budget,
        "id": models.Lead.id,
    }
    sort_col = sort_col_map.get(sort_by, models.Lead.message_time)
    if sort_dir == "asc":
        q = q.order_by(sort_col.asc().nullslast())
    else:
        q = q.order_by(sort_col.desc().nullslast())

    offset = (page - 1) * per_page
    rows = q.offset(offset).limit(per_page).all()

    items = []
    for r in rows:
        items.append({
            "id": r.id,
            "message_id": r.message_id or "",
            "message_time": r.message_time.isoformat() if r.message_time else None,
            "sender_name": r.sender_name or "",
            "type_of_lead": r.type_of_lead or "",
            "type_of_property": r.type_of_property or "",
            "beds_baths": r.beds_baths or "",
            "area_city": r.area_city or "",
            "budget": r.budget or "",
            "name": r.name or "",
            "number": r.number or "",
            "email": r.email or "",
            "call_appointment_time": r.call_appointment_time or "",
            "lead_by": r.lead_by_cleaned or r.lead_by or "",
            "lead_for": r.lead_for or "",
            "cash_finance": r.cash_finance or "",
            "under_contract": r.under_contract or "",
            "willing_to_sign": r.willing_to_sign or "",
            "note": r.note or "",
        })

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
        "items": items,
    }


@router.get("/export")
def export_leads_csv(
    search: Optional[str] = Query(None),
    type_of_lead: Optional[str] = Query(None),
    type_of_property: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    budget: Optional[str] = Query(None),
    beds: Optional[str] = Query(None),
    baths: Optional[str] = Query(None),
    cash_finance: Optional[str] = Query(None),
    under_contract: Optional[str] = Query(None),
    willing_to_sign: Optional[str] = Query(None),
    lead_by: Optional[str] = Query(None),
    lead_for: Optional[str] = Query(None),
    range: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if role and role.strip().lower() != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Only administrators can do that operation."
        )

    s_date, e_date = crud.resolve_date_range(db, range, start_date, end_date)
    q = build_leads_query(
        db, search, type_of_lead, type_of_property,
        state, city, budget, beds, baths, cash_finance,
        under_contract, willing_to_sign, lead_by, lead_for,
        s_date, e_date
    )
    rows = q.order_by(models.Lead.message_time.desc().nullslast()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Message ID", "Message Time", "Sender", "Type of Lead",
        "Property Type", "Beds/Baths", "Area/City", "Budget", "Name",
        "Phone", "Email", "Call Appointment", "Lead By", "Lead For",
        "Cash/Finance", "Under Contract", "Willing to Sign", "Note"
    ])
    for r in rows:
        writer.writerow([
            r.id,
            r.message_id or "",
            r.message_time.strftime("%Y-%m-%d %H:%M:%S") if r.message_time else "",
            r.sender_name or "",
            r.type_of_lead or "",
            r.type_of_property or "",
            r.beds_baths or "",
            r.area_city or "",
            r.budget or "",
            r.name or "",
            r.number or "",
            r.email or "",
            r.call_appointment_time or "",
            r.lead_by_cleaned or r.lead_by or "",
            r.lead_for or "",
            r.cash_finance or "",
            r.under_contract or "",
            r.willing_to_sign or "",
            r.note or "",
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=leads_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.get("/filter-options")
def get_filter_options(db: Session = Depends(get_db)):
    """Return distinct values for filter dropdowns."""
    cached = cache.get("filter-options")
    if cached is not None:
        return cached

    lead_types = ["Buyer", "Seller", "Investor"]
    prop_types = ["SFH", "Condo", "MFH", "Land", "Single-Family Home (SFH)", "SFH/MFH", "SFH with Land", "Commercial", "Townhouse"]
    
    # States
    us_states = sorted([
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ])

    lead_bys = crud.get_employees(db)

    lead_fors_rows = db.query(models.Lead.lead_for).filter(
        models.Lead.lead_for.isnot(None), models.Lead.lead_for != ""
    ).distinct().limit(50).all()
    lead_fors = sorted([r[0].strip() for r in lead_fors_rows if r[0]])

    result = {
        "type_of_lead": lead_types,
        "type_of_property": prop_types,
        "states": us_states,
        "budget": ["<$200k", "$200k-$500k", "$500k+"],
        "beds": ["1", "2", "3", "4", "5+"],
        "baths": ["1", "1.5", "2", "2.5", "3+"],
        "lead_by": lead_bys,
        "lead_for": lead_fors,
        "under_contract": ["No", "Yes"],
        "willing_to_sign": ["Yes", "No"],
        "cash_finance": ["Cash", "Finance", "Both"],
    }
    cache.set("filter-options", result, ttl=300)
    return result


@router.get("/{lead_id}")
def get_lead_detail(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        return {"error": "Lead not found"}
    return {
        "id": lead.id,
        "message_id": lead.message_id or "",
        "message_time": lead.message_time.isoformat() if lead.message_time else None,
        "sender_id": lead.sender_id or "",
        "sender_name": lead.sender_name or "",
        "type_of_lead": lead.type_of_lead or "",
        "type_of_property": lead.type_of_property or "",
        "beds_baths": lead.beds_baths or "",
        "area_city": lead.area_city or "",
        "budget": lead.budget or "",
        "cash_finance": lead.cash_finance or "",
        "under_contract": lead.under_contract or "",
        "willing_to_sign": lead.willing_to_sign or "",
        "name": lead.name or "",
        "number": lead.number or "",
        "email": lead.email or "",
        "size": lead.size or "",
        "call_appointment_time": lead.call_appointment_time or "",
        "lead_by": lead.lead_by or "",
        "lead_by_cleaned": lead.lead_by_cleaned or "",
        "lead_for": lead.lead_for or "",
        "note": lead.note or "",
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
    }
