import os
import sys

# Ensure backend directory is in sys.path so modules resolve whether run from root or backend/
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import models
from database import engine
from routers import dashboard, leads, analytics, sync, users, auth

load_dotenv()

# Create tables (if DB is configured)
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create tables: {e}")

app = FastAPI(
    title="ISA Lead Management Dashboard API",
    description="Backend API for the ISA Sales Lead Management Dashboard",
    version="1.0.0"
)

# CORS Configuration: Supports local dev, custom production domains, and cloud previews
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if cors_origins_env:
    for origin in cors_origins_env.split(","):
        cleaned = origin.strip()
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https?://.*"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(leads.router)
app.include_router(analytics.router)
app.include_router(sync.router)
app.include_router(users.router)
app.include_router(auth.router)


@app.on_event("startup")
def startup_event():
    print("[Startup] Initializing application and launching background cache warmer...")
    from routers.dashboard import trigger_cache_warming_async
    trigger_cache_warming_async()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "ISA Lead Dashboard API is running"}


# Static file serving for unified single-server deployment (FastAPI serving built React SPA)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist) and os.path.exists(os.path.join(frontend_dist, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(status_code=404, detail="Not found")
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "ISA Lead Management Dashboard API", "docs": "/docs"}
