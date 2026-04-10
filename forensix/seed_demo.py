"""
Seed script — populates the local database with sample demo cases
so the dashboard looks populated straight away.
Run from forensix/ root: python seed_demo.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from backend.database.config import SessionLocal, engine
from backend.models.models import Base, Case
import datetime, uuid

Base.metadata.create_all(bind=engine)

DEMO_CASES = [
    {
        "case_number":  f"FX-{uuid.uuid4().hex[:8].upper()}",
        "title":        "Warehouse Incident — Block 7",
        "description":  "Victim found near loading bay. Signs of struggle. Multiple blood droplets consistent with medium-velocity spatter.",
        "location":     "42 Industrial Way, Block 7",
        "investigator": "Agent OMEGA-1",
        "status":       "Open",
        "priority":     "Critical",
        "weapon_detected": True,
        "blood_detected":  True,
        "face_detected":   False,
        "threat_level":    85.0,
        "ai_results": {
            "weapon_detection": {
                "status": "success", "model": "YOLOv8n (COCO)",
                "total_objects": 3, "weapons_found": 1,
                "detections": [
                    {"label": "knife", "is_weapon": True, "confidence": 0.87, "box": [120, 80, 210, 190], "class_id": 43}
                ]
            },
            "blood_analysis": {
                "status": "success", "pattern": "Medium-Velocity Impact Spatter",
                "spots_count": 23, "average_size": 45.2,
                "total_area_px": 1040, "coverage_pct": 0.31
            },
            "footprint_match": {"status": "success", "match": False, "similarity": 32.1, "best_match": None, "keypoints_detected": 287},
            "face_recognition": {"status": "success", "faces_detected": 0, "suspects_in_db": 0, "faces": []},
            "threat_level": 85.0
        }
    },
    {
        "case_number":  f"FX-{uuid.uuid4().hex[:8].upper()}",
        "title":        "Convenience Store Robbery Evidence",
        "description":  "CCTV footage extracted. Suspect faces partially visible. Possible accomplice. Tread match attempted.",
        "location":     "Downtown, 5th Ave Quikmart",
        "investigator": "Agent DELTA-3",
        "status":       "Pending",
        "priority":     "High",
        "weapon_detected": True,
        "blood_detected":  False,
        "face_detected":   True,
        "threat_level":    65.0,
        "ai_results": {
            "weapon_detection": {
                "status": "success", "model": "YOLOv8n (COCO)",
                "total_objects": 2, "weapons_found": 1,
                "detections": [
                    {"label": "baseball bat", "is_weapon": True, "confidence": 0.74, "box": [200, 100, 320, 380], "class_id": 34}
                ]
            },
            "blood_analysis": {"status": "success", "pattern": "None detected", "spots_count": 0, "average_size": 0.0, "total_area_px": 0, "coverage_pct": 0.0},
            "footprint_match": {"status": "success", "match": True, "similarity": 71.4, "best_match": "nike_airmax_sole.jpg", "keypoints_detected": 412, "database_size": 3},
            "face_recognition": {
                "status": "success", "faces_detected": 1, "suspects_in_db": 0,
                "faces": [{"name": "Unknown Suspect", "confidence": 0.0, "box": [300, 50, 480, 280], "matched": False}]
            },
            "threat_level": 65.0
        }
    },
    {
        "case_number":  f"FX-{uuid.uuid4().hex[:8].upper()}",
        "title":        "Park Altercation — Scene Alpha",
        "description":  "Low-priority incident. Minor blood trace. No weapons identified by AI scan.",
        "location":     "Riverside Park, Sector 3",
        "investigator": "Agent OMEGA-2",
        "status":       "Closed",
        "priority":     "Low",
        "weapon_detected": False,
        "blood_detected":  True,
        "face_detected":   False,
        "threat_level":    22.0,
        "ai_results": {
            "weapon_detection": {"status": "success", "model": "YOLOv8n (COCO)", "total_objects": 0, "weapons_found": 0, "detections": []},
            "blood_analysis": {"status": "success", "pattern": "Passive Drip / Contact Transfer", "spots_count": 4, "average_size": 120.5, "total_area_px": 482, "coverage_pct": 0.06},
            "footprint_match": {"status": "success", "match": False, "similarity": 0.0, "best_match": None, "keypoints_detected": 0, "message": "Tread database is empty"},
            "face_recognition": {"status": "success", "faces_detected": 0, "suspects_in_db": 0, "faces": []},
            "threat_level": 22.0
        }
    }
]

db = SessionLocal()
try:
    existing = db.query(Case).count()
    if existing > 0:
        print(f"[Seed] Database already has {existing} case(s). Skipping to avoid duplicates.")
        print("[Seed] Delete forensix_local.db and re-run to re-seed.")
    else:
        for data in DEMO_CASES:
            case = Case(**data)
            db.add(case)
        db.commit()
        print(f"[Seed] ✅ Created {len(DEMO_CASES)} demo cases successfully.")
        print("[Seed] Open http://localhost:5173 to see the dashboard.")
finally:
    db.close()
