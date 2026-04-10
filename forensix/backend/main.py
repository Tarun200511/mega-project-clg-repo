import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database.config import Base, engine
from backend.routes import cases, analyze, auth, reports

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("forensix")

# ── Storage dirs ───────────────────────────────────────────────────────────────
for d in ["storage/cases", "storage/temp", "storage/faces", "storage/treads", "storage/reports"]:
    os.makedirs(d, exist_ok=True)
    logger.info(f"Ensured storage directory: {d}")

# ── DB Bootstrap ───────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)
logger.info("Database tables synchronised")

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ForensiX API",
    version="2.0.0",
    description="AI Crime Scene Intelligence System — Backend",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ───────────────────────────────────────────────────────────────
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router,    prefix="/api/auth",    tags=["Auth"])
app.include_router(cases.router,   prefix="/api",         tags=["Cases"])
app.include_router(analyze.router, prefix="/api",         tags=["Analysis"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/", tags=["Health"])
def health():
    return {"status": "online", "system": "ForensiX v2.0", "modules": ["YOLOv8", "OpenCV", "FaceRec", "ORB"]}
