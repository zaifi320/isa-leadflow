import os
import re
import csv
import io
import time
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import requests
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models
from database import SessionLocal

load_dotenv()

logger = logging.getLogger(__name__)

COLUMN_MAP = {
    "message id": "message_id",
    "message time": "message_time",
    "sender id": "sender_id",
    "sender name": "sender_name",
    "type of lead": "type_of_lead",
    "type of property": "type_of_property",
    "beds/baths": "beds_baths",
    "beds / baths": "beds_baths",
    "area/city": "area_city",
    "area / city": "area_city",
    "budget": "budget",
    "cash/finance": "cash_finance",
    "cash / finance": "cash_finance",
    "under contract": "under_contract",
    "willing to sign contract": "willing_to_sign",
    "name": "name",
    "number": "number",
    "email": "email",
    "size": "size",
    "call appointment time": "call_appointment_time",
    "lead by": "lead_by",
    "lead by (cleaned)": "lead_by_cleaned",
    "lead for": "lead_for",
    "note": "note",
}


def extract_sheet_id(sheet_input: str) -> str:
    if not sheet_input:
        return ""
    sheet_input = sheet_input.strip()
    match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', sheet_input)
    if match:
        return match.group(1)
    return sheet_input.split('/')[0].split('?')[0].strip()


def parse_datetime(val: Any) -> Optional[datetime]:
    if not val:
        return None
    if isinstance(val, datetime):
        return val.replace(tzinfo=None) if val.tzinfo else val
    val_str = str(val).strip()
    try:
        dt = datetime.fromisoformat(val_str.replace("Z", "+00:00"))
        return dt.replace(tzinfo=None)
    except Exception:
        pass
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y %I:%M:%S %p",
        "%m/%d/%Y %I:%M %p",
        "%m/%d/%Y",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(val_str, fmt)
        except ValueError:
            continue
    return None


def fetch_from_public_csv(sheet_id: str) -> List[Dict[str, Any]]:
    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    for attempt in range(1, 3):
        try:
            resp = requests.get(csv_url, headers=headers, timeout=25)
            if resp.status_code == 200 and resp.text:
                reader = csv.DictReader(io.StringIO(resp.text))
                return list(reader)
            elif resp.status_code in (429, 500, 502, 503, 504):
                logger.warning(f"Google Sheet export returned HTTP {resp.status_code}. Retrying ({attempt}/2)...")
                time.sleep(1.5)
        except Exception as e:
            logger.warning(f"Google Sheet export attempt {attempt} failed ({e}). Retrying...")
            time.sleep(1.5)
    return []


def ingest_records(db: Session, records: List[Dict[str, Any]], source_label: str, start_time: Optional[datetime] = None) -> Dict[str, Any]:
    if not start_time:
        start_time = datetime.now(timezone.utc).replace(tzinfo=None)

    auto_id_counter = 1

    # Load existing leads into memory to check message_id and detect updates
    existing_leads = db.query(models.Lead).all()
    existing_map = {l.message_id: l for l in existing_leads if l.message_id}

    new_leads = []
    updated_count = 0
    seen_in_batch = set()

    updatable_fields = [
        "sender_id", "sender_name", "type_of_lead", "type_of_property",
        "beds_baths", "area_city", "budget", "cash_finance",
        "under_contract", "willing_to_sign", "name", "number",
        "email", "size", "call_appointment_time", "lead_by",
        "lead_by_cleaned", "lead_for", "note"
    ]

    for row in records:
        normalized = {}
        for col_name, val in row.items():
            if not col_name:
                continue
            attr = COLUMN_MAP.get(str(col_name).strip().lower())
            if attr:
                normalized[attr] = val

        msg_id = normalized.get("message_id")
        if not msg_id:
            msg_id = f"LEAD-{auto_id_counter}"
            auto_id_counter += 1

        msg_id_str = str(msg_id).strip()

        # Prevent duplicate within this same batch
        if msg_id_str in seen_in_batch:
            continue
        seen_in_batch.add(msg_id_str)

        msg_time = parse_datetime(normalized.get("message_time")) or datetime.now()
        lead_by = str(normalized.get("lead_by", "")).strip() or None
        lead_by_cleaned = str(normalized.get("lead_by_cleaned", "")).strip() or lead_by

        if msg_id_str in existing_map:
            # Check if any field changed
            existing_lead = existing_map[msg_id_str]
            row_data = {
                "sender_id": str(normalized.get("sender_id", "")).strip() or None,
                "sender_name": str(normalized.get("sender_name", "")).strip() or None,
                "type_of_lead": str(normalized.get("type_of_lead", "")).strip() or None,
                "type_of_property": str(normalized.get("type_of_property", "")).strip() or None,
                "beds_baths": str(normalized.get("beds_baths", "")).strip() or None,
                "area_city": str(normalized.get("area_city", "")).strip() or None,
                "budget": str(normalized.get("budget", "")).strip() or None,
                "cash_finance": str(normalized.get("cash_finance", "")).strip() or None,
                "under_contract": str(normalized.get("under_contract", "")).strip() or None,
                "willing_to_sign": str(normalized.get("willing_to_sign", "")).strip() or None,
                "name": str(normalized.get("name", "")).strip() or None,
                "number": str(normalized.get("number", "")).strip() or None,
                "email": str(normalized.get("email", "")).strip() or None,
                "size": str(normalized.get("size", "")).strip() or None,
                "call_appointment_time": str(normalized.get("call_appointment_time", "")).strip() or None,
                "lead_by": lead_by,
                "lead_by_cleaned": lead_by_cleaned,
                "lead_for": str(normalized.get("lead_for", "")).strip() or None,
                "note": str(normalized.get("note", "")).strip() or None,
            }
            has_changed = False
            for f in updatable_fields:
                curr_v = getattr(existing_lead, f)
                new_v = row_data[f]
                if (curr_v or None) != (new_v or None):
                    setattr(existing_lead, f, new_v)
                    has_changed = True

            if has_changed:
                updated_count += 1
        else:
            new_lead = models.Lead(
                message_id=msg_id_str,
                message_time=msg_time,
                sender_id=str(normalized.get("sender_id", "")).strip() or None,
                sender_name=str(normalized.get("sender_name", "")).strip() or None,
                type_of_lead=str(normalized.get("type_of_lead", "")).strip() or None,
                type_of_property=str(normalized.get("type_of_property", "")).strip() or None,
                beds_baths=str(normalized.get("beds_baths", "")).strip() or None,
                area_city=str(normalized.get("area_city", "")).strip() or None,
                budget=str(normalized.get("budget", "")).strip() or None,
                cash_finance=str(normalized.get("cash_finance", "")).strip() or None,
                under_contract=str(normalized.get("under_contract", "")).strip() or None,
                willing_to_sign=str(normalized.get("willing_to_sign", "")).strip() or None,
                name=str(normalized.get("name", "")).strip() or None,
                number=str(normalized.get("number", "")).strip() or None,
                email=str(normalized.get("email", "")).strip() or None,
                size=str(normalized.get("size", "")).strip() or None,
                call_appointment_time=str(normalized.get("call_appointment_time", "")).strip() or None,
                lead_by=lead_by,
                lead_by_cleaned=lead_by_cleaned,
                lead_for=str(normalized.get("lead_for", "")).strip() or None,
                note=str(normalized.get("note", "")).strip() or None,
            )
            new_leads.append(new_lead)
            existing_map[msg_id_str] = new_lead

    # Bulk insert only the new leads
    if new_leads:
        db.add_all(new_leads)
    db.commit()

    end_time = datetime.now(timezone.utc).replace(tzinfo=None)
    duration_sec = round(max((end_time - start_time).total_seconds(), 0.1), 2)
    total_in_db = db.query(models.Lead).count()
    new_added = len(new_leads)

    # Log sync history
    sync_record = models.SyncHistory(
        sync_time=end_time,
        start_time=start_time,
        end_time=end_time,
        duration_seconds=duration_sec,
        records_processed=len(records),
        records_synced=total_in_db,
        new_leads=new_added,
        updated_leads=updated_count,
        status="success",
        source=f"{source_label} (+{new_added} new, {updated_count} updated)",
        error_message=None,
    )
    db.add(sync_record)
    db.commit()

    return {
        "success": True,
        "status": "success",
        "message": f"Sync complete: {new_added} new leads, {updated_count} updated (Total: {total_in_db})",
        "records_processed": len(records),
        "records_synced": total_in_db,
        "new_leads_added": new_added,
        "updated_leads": updated_count,
        "duration_seconds": duration_sec,
        "sync_time": end_time.isoformat() + "Z",
    }


def sync_google_sheets(db: Session) -> Dict[str, Any]:
    start_time = datetime.now()
    raw_sheet_id = os.getenv("GOOGLE_SHEETS_ID", "").strip()
    creds_path = os.getenv("GOOGLE_SHEETS_CREDENTIALS_PATH", "credentials.json").strip()
    local_csv_path = os.path.join(os.path.dirname(__file__), "leads.csv")

    # Priority 1: If a local leads.csv was exported and placed in backend folder
    if os.path.exists(local_csv_path):
        try:
            with open(local_csv_path, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                records = list(reader)
            if records:
                return ingest_records(db, records, "local leads.csv", start_time=start_time)
        except Exception as e:
            logger.error(f"Error reading local CSV: {e}")

    sheet_id = extract_sheet_id(raw_sheet_id)

    if not sheet_id or sheet_id == "your_google_sheets_id_here":
        end_time = datetime.now()
        duration_sec = round((end_time - start_time).total_seconds(), 2)
        err_msg = "GOOGLE_SHEETS_ID is not configured in .env."
        sync_record = models.SyncHistory(
            sync_time=end_time,
            start_time=start_time,
            end_time=end_time,
            duration_seconds=duration_sec,
            records_processed=0,
            records_synced=db.query(models.Lead).count(),
            new_leads=0,
            updated_leads=0,
            status="failed",
            error_message=err_msg,
            source="google_sheets",
        )
        db.add(sync_record)
        db.commit()
        return {
            "success": False,
            "status": "unconfigured",
            "message": err_msg,
            "records_processed": 0,
            "records_synced": 0,
            "new_leads_added": 0,
            "updated_leads": 0,
            "duration_seconds": duration_sec,
        }

    records: List[Dict[str, Any]] = []
    auth_method = "service_account"

    # Priority 2: Google Service Account JSON
    if os.path.exists(creds_path):
        try:
            import gspread
            from google.oauth2.service_account import Credentials

            scopes = [
                "https://www.googleapis.com/auth/spreadsheets.readonly",
                "https://www.googleapis.com/auth/drive.readonly",
            ]
            creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
            client = gspread.authorize(creds)
            sheet = client.open_by_key(sheet_id).sheet1
            records = sheet.get_all_records()
            auth_method = "service_account"
        except Exception as e:
            logger.warning(f"Service account auth failed: {e}. Trying public link fallback...")

    # Priority 3: Public CSV export link
    if not records:
        try:
            records = fetch_from_public_csv(sheet_id)
            if records:
                auth_method = "public_link"
        except Exception as e:
            logger.error(f"Public link fetch failed: {e}")

    if not records:
        end_time = datetime.now()
        duration_sec = round((end_time - start_time).total_seconds(), 2)
        error_msg = f"Could not read from Google Sheet (ID: {sheet_id})."
        sync_record = models.SyncHistory(
            sync_time=end_time,
            start_time=start_time,
            end_time=end_time,
            duration_seconds=duration_sec,
            records_processed=0,
            records_synced=db.query(models.Lead).count(),
            new_leads=0,
            updated_leads=0,
            status="failed",
            error_message=error_msg,
            source="google_sheets",
        )
        db.add(sync_record)
        db.commit()
        return {
            "success": False,
            "status": "failed",
            "message": error_msg,
            "records_processed": 0,
            "records_synced": 0,
            "new_leads_added": 0,
            "updated_leads": 0,
            "duration_seconds": duration_sec,
        }

    return ingest_records(db, records, f"google_sheets ({auth_method})", start_time=start_time)


if __name__ == "__main__":
    print("Testing Google Sheets fast sync...")
    db = SessionLocal()
    try:
        res = sync_google_sheets(db)
        print("Result:", json.dumps(res, indent=2))
    finally:
        db.close()
