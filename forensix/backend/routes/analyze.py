import logging
import shutil
import uuid
import traceback
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
import cv2

from ai_modules.weapon_detection import WeaponDetector
from ai_modules.blood_analysis import BloodAnalyzer
from ai_modules.footprint_match import FootprintMatcher
from ai_modules.face_recognition_module import FaceRecognizer

logger = logging.getLogger("forensix.analyze")
router = APIRouter()

# ── AI Module Singletons ───────────────────────────────────────────────────────
_weapon_detector  = None
_blood_analyzer   = BloodAnalyzer()
_footprint_matcher = FootprintMatcher()
_face_recognizer  = FaceRecognizer()


def _get_detector():
    global _weapon_detector
    if _weapon_detector is None:
        _weapon_detector = WeaponDetector()
    return _weapon_detector


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


@router.post("/analyze", summary="Run full AI analysis on an uploaded image")
async def analyze_evidence(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {ext}")

    file_id   = str(uuid.uuid4())
    temp_dir  = Path("storage/temp")
    temp_path = temp_dir / f"{file_id}{ext}"

    # Save upload
    with open(temp_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    logger.info(f"Saved evidence upload → {temp_path}")

    # Load image
    image = cv2.imread(str(temp_path))
    if image is None:
        temp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="Could not decode image — verify file is a valid image")

    h, w = image.shape[:2]
    logger.info(f"Image loaded: {w}×{h}px — running AI pipeline")

    # ── Run all modules ────────────────────────────────────────────────────────
    weapons    = _get_detector().detect(image)
    blood      = _blood_analyzer.analyze(image)
    footprints = _footprint_matcher.match(image)
    faces      = _face_recognizer.recognize(image)

    # ── Threat level ───────────────────────────────────────────────────────────
    threat = _calculate_threat(weapons, blood, faces)

    result = {
        "file_id": file_id,
        "image_dimensions": {"width": w, "height": h},
        "temp_file_url": f"/storage/temp/{file_id}{ext}",
        "weapon_detection": weapons,
        "blood_analysis": blood,
        "footprint_match": footprints,
        "face_recognition": faces,
        "threat_level": threat,
    }

    logger.info(f"Analysis complete — threat={threat:.1f}%  weapons={len(weapons.get('detections', []))}  faces={len(faces.get('faces', []))}")
    return result


def _calculate_threat(weapons, blood, faces) -> float:
    score = 0.0
    dets = weapons.get("detections", [])
    if dets:
        score += 50 + min(30, len(dets) * 15)
    b = blood.get("pattern", "None detected")
    if b not in ("None detected", None, ""):
        score += 20
    if faces.get("faces"):
        score += 10
    return round(min(score, 100.0), 1)
