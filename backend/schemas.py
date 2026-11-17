from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class LeadBase(BaseModel):
    message_id: Optional[str] = None
    message_time: Optional[datetime] = None
    sender_id: Optional[str] = None
    sender_name: Optional[str] = None
    type_of_lead: Optional[str] = None
    type_of_property: Optional[str] = None
    beds_baths: Optional[str] = None
    area_city: Optional[str] = None
    budget: Optional[str] = None
    cash_finance: Optional[str] = None
    under_contract: Optional[str] = None
    willing_to_sign: Optional[str] = None
    name: Optional[str] = None
    number: Optional[str] = None
    email: Optional[str] = None
    size: Optional[str] = None
    call_appointment_time: Optional[str] = None
    lead_by: Optional[str] = None
    lead_by_cleaned: Optional[str] = None
    lead_for: Optional[str] = None
    note: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadResponse(LeadBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class KPIResponse(BaseModel):
    total_leads: int
    seller_leads: int
    buyer_leads: int
    todays_leads: int
    leads_with_phone: int
    missing_contact: int


class DailyTrendItem(BaseModel):
    date: str
    count: int


class LeadByTypeItem(BaseModel):
    type: str
    count: int
    percentage: float


class LeadByPropertyItem(BaseModel):
    property_type: str
    count: int
    percentage: float


class LeadByStateItem(BaseModel):
    state: str
    count: int


class TopLeadByItem(BaseModel):
    lead_by_cleaned: str
    count: int


class StateTableRow(BaseModel):
    state: str
    state_name: Optional[str] = None
    total_leads: int
    month_leads: int
    today_leads: int


class SyncHistoryResponse(BaseModel):
    id: int
    sync_time: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    records_processed: Optional[int] = 0
    records_synced: Optional[int] = 0
    new_leads: Optional[int] = 0
    updated_leads: Optional[int] = 0
    status: str
    error_message: Optional[str] = None
    source: Optional[str] = None

    model_config = {"from_attributes": True}


class SyncSummaryResponse(BaseModel):
    last_successful_sync: Optional[datetime] = None
    last_sync_status: str = "success"
    total_syncs: int = 0
    successful_syncs: int = 0
    failed_syncs: int = 0
    total_new_leads: int = 0
    total_updated_leads: int = 0
    latest_new_leads: int = 0
    latest_updated_leads: int = 0
    avg_duration_seconds: float = 0.0


class SyncHistoryPagination(BaseModel):
    items: List[SyncHistoryResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class SyncTrendItem(BaseModel):
    date: str
    label: str
    count: int
    new_leads: int


# --- User & Online Status Schemas ---

class UserCreate(BaseModel):
    name: str
    email: str
    password: Optional[str] = "Lead@2026"
    role: Optional[str] = "Agent"
    department: Optional[str] = "ISA Sales Team"
    avatar_color: Optional[str] = "#2563eb"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    avatar_color: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: str
    avatar_color: str
    is_online: bool
    last_heartbeat: Optional[datetime] = None
    last_login: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    last_active_page: Optional[str] = None
    seconds_since_heartbeat: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# --- Authentication Schemas ---

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: Optional[bool] = False


class LoginResponse(BaseModel):
    success: bool
    token: str
    user: UserResponse
    message: str


class ForgotPasswordRequest(BaseModel):
    email: str


class UserSummaryResponse(BaseModel):
    total_users: int = 0
    online_users: int = 0
    offline_users: int = 0
    active_today: int = 0


class HeartbeatRequest(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    current_page: Optional[str] = "/dashboard"


class HeartbeatResponse(BaseModel):
    success: bool
    is_online: bool
    server_time: datetime
    online_count: int


class UserActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: str
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserActivityLogPagination(BaseModel):
    items: List[UserActivityLogResponse]
    total: int
    page: int
    limit: int
    total_pages: int
