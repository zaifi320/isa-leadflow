import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Ensure .env in backend directory is loaded reliably regardless of working dir
backend_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

raw_url = os.getenv("DATABASE_URL", "")

# Neon often provides postgres:// which SQLAlchemy 2.x requires as postgresql://
if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+psycopg2://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Check if using unconfigured placeholder
is_placeholder = (
    not raw_url
    or "host.neon.tech" in raw_url
    or "user:password" in raw_url
    or "your_database_url_here" in raw_url
)

connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
}

if is_placeholder:
    DATABASE_URL = "sqlite:///./dev_sample.db"
    connect_args = {"check_same_thread": False}
    print("[DB] Using local SQLite database (dev_sample.db) until Neon credentials are added to .env.")
else:
    DATABASE_URL = raw_url
    connect_args = {
        "connect_timeout": 20,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
    engine_kwargs.update({
        "pool_recycle": 900,
        "pool_size": 15,
        "max_overflow": 25,
        "pool_timeout": 30,
    })

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_kwargs)
    # Quick connectivity test
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    safe_db_desc = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "SQLite"
    print(f"[DB] Successfully connected to database: {safe_db_desc}")
except Exception as e:
    print(f"[DB Warning] Could not connect to configured DB ({e}). Falling back to local SQLite.")
    DATABASE_URL = "sqlite:///./dev_sample.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def safe_db_call(fn, db, *args, **kwargs):
    """Executes a database query function with automatic reconnect/retry on stale socket error."""
    try:
        return fn(db, *args, **kwargs)
    except Exception as e:
        print(f"[DB Warning] Query failed ({e}), rolling back and retrying...")
        db.rollback()
        return fn(db, *args, **kwargs)

