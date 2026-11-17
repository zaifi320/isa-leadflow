from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean
from sqlalchemy.sql import func
from database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, unique=True, index=True, nullable=True)
    message_time = Column(DateTime, nullable=True)
    sender_id = Column(String, nullable=True)
    sender_name = Column(String, nullable=True)
    type_of_lead = Column(String, nullable=True)
    type_of_property = Column(String, nullable=True)
    beds_baths = Column(String, nullable=True)
    area_city = Column(String, nullable=True)
    budget = Column(String, nullable=True)
    cash_finance = Column(String, nullable=True)
    under_contract = Column(String, nullable=True)
    willing_to_sign = Column(String, nullable=True)
    name = Column(String, nullable=True)
    number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    size = Column(String, nullable=True)
    call_appointment_time = Column(String, nullable=True)
    lead_by = Column(String, nullable=True)
    lead_by_cleaned = Column(String, nullable=True)
    lead_for = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class SyncHistory(Base):
    __tablename__ = "sync_history"

    id = Column(Integer, primary_key=True, index=True)
    sync_time = Column(DateTime, server_default=func.now())
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    records_processed = Column(Integer, default=0)
    records_synced = Column(Integer, default=0)
    new_leads = Column(Integer, default=0)
    updated_leads = Column(Integer, default=0)
    status = Column(String, default="success")
    error_message = Column(Text, nullable=True)
    source = Column(String, default="google_sheets")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="Agent")  # "Admin", "Agent", "Manager"
    department = Column(String, default="ISA Sales Team")
    avatar_color = Column(String, default="#2563eb")
    password_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_online = Column(Boolean, default=False)
    last_heartbeat = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    last_active_page = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    user_name = Column(String, nullable=False)
    action = Column(String, nullable=False)  # "LOGIN", "LOGOUT", "HEARTBEAT", "PAGE_VIEW", "TIMEOUT"
    details = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
