import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 rounds and random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return f"pbkdf2_sha256${salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password in constant time to prevent timing attacks."""
    if not hashed_password or not hashed_password.startswith("pbkdf2_sha256$"):
        return False
    parts = hashed_password.split("$")
    if len(parts) != 3:
        return False
    salt = parts[1]
    expected_hex = parts[2]
    key = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return secrets.compare_digest(key.hex(), expected_hex)


def generate_session_token(user_id: int) -> str:
    """Generate a high-entropy cryptographically secure session token."""
    raw = f"{user_id}:{secrets.token_urlsafe(32)}:{datetime.utcnow().timestamp()}"
    return hashlib.sha256(raw.encode()).hexdigest()

