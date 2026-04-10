import logging
import uuid
import datetime
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database.config import get_db
from backend.models.models import Case, EvidenceItem

logger = logging.getLogger("forensix.cases")
router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────────

class CaseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    investigator: Optional[str] = None
    priority: Optional[str] = "Medium"
    evidence_image_url: Optional[str] = None
    ai_results: Optional[Dict] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None


class CaseOut(BaseModel):
    id: int
    case_number: str
    title: str
    description: Optional[str]
    location: Optional[str]
    investigator: Optional[str]
    status: str
    priority: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    evidence_image_url: Optional[str]
    ai_results: Optional[Dict]
    weapon_detected: bool
    blood_detected: bool
    face_detected: bool
    threat_level: float

    class Config:
        from_attributes = True


class StatsOut(BaseModel):
    total: int
    open: int
    closed: int
    weapon_cases: int
    blood_cases: int
    face_cases: int
    high_threat: int


# ── Helpers ────────────────────────────────────────────────────────────────────

def _compute_threat(results: Optional[Dict]) -> float:
    if not results:
        return 0.0
    score = 0.0
    w = results.get("weapon_detection", {})
    if w.get("detections"):
        score += 50 + min(30, len(w["detections"]) * 15)
    b = results.get("blood_analysis", {})
    if b.get("pattern") and b["pattern"] != "None detected":
        score += 20
    f = results.get("face_recognition", {})
    if f.get("faces"):
        score += 10
    return min(score, 100.0)


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/create-case", response_model=CaseOut, status_code=201)
def create_case(body: CaseCreate, db: Session = Depends(get_db)):
    case_number = f"FX-{uuid.uuid4().hex[:8].upper()}"
    threat = _compute_threat(body.ai_results)

    weapon_detected = bool(body.ai_results and body.ai_results.get("weapon_detection", {}).get("detections"))
    blood_detected  = bool(body.ai_results and body.ai_results.get("blood_analysis", {}).get("pattern") not in [None, "None detected"])
    face_detected   = bool(body.ai_results and body.ai_results.get("face_recognition", {}).get("faces"))

    db_case = Case(
        case_number=case_number,
        title=body.title,
        description=body.description,
        location=body.location,
        investigator=body.investigator,
        priority=body.priority or "Medium",
        evidence_image_url=body.evidence_image_url,
        ai_results=body.ai_results,
        weapon_detected=weapon_detected,
        blood_detected=blood_detected,
        face_detected=face_detected,
        threat_level=threat,
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    logger.info(f"Created case {db_case.case_number} — threat={threat:.1f}")
    return db_case


@router.get("/cases", response_model=List[CaseOut])
def list_cases(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Case)
    if status:
        q = q.filter(Case.status == status)
    if priority:
        q = q.filter(Case.priority == priority)
    return q.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/cases/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    all_cases = db.query(Case).all()
    return StatsOut(
        total=len(all_cases),
        open=sum(1 for c in all_cases if c.status == "Open"),
        closed=sum(1 for c in all_cases if c.status == "Closed"),
        weapon_cases=sum(1 for c in all_cases if c.weapon_detected),
        blood_cases=sum(1 for c in all_cases if c.blood_detected),
        face_cases=sum(1 for c in all_cases if c.face_detected),
        high_threat=sum(1 for c in all_cases if c.threat_level >= 70),
    )


@router.get("/case/{id}", response_model=CaseOut)
def get_case(id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/case/{id}", response_model=CaseOut)
def update_case(id: int, body: CaseUpdate, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    for field, val in body.dict(exclude_unset=True).items():
        setattr(case, field, val)
    case.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(case)
    return case


@router.delete("/case/{id}", status_code=204)
def delete_case(id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
