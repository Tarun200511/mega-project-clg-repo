import cv2
import numpy as np
import logging
import traceback

logger = logging.getLogger("forensix.ai.weapon")


class WeaponDetector:
    """
    YOLOv8-based weapon detection.
    Uses the base COCO model; for production swap in a custom-trained
    weapon-specific weights file (e.g., 'weapon_best.pt').
    """

    WEAPON_CLASSES = {
        "knife", "scissors", "baseball bat", "fork", "gun", "pistol",
        "rifle", "sword", "machete", "crowbar", "bat"
    }

    COCO_WEAPON_IDS = {43: "knife", 44: "fork", 34: "baseball bat", 76: "scissors"}

    def __init__(self, weights: str = "yolov8n.pt", conf: float = 0.20):
        self.model = None
        self.conf  = conf
        try:
            from ultralytics import YOLO
            self.model = YOLO(weights)
            logger.info(f"WeaponDetector: loaded {weights}")
        except Exception as e:
            logger.warning(f"WeaponDetector: failed to load model — {e}")

    def detect(self, image: np.ndarray) -> dict:
        if self.model is None:
            return {"status": "unavailable", "message": "YOLOv8 model not loaded", "detections": []}

        try:
            results = self.model(image, verbose=False, conf=self.conf)
            detections = []

            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    label  = self.model.names[cls_id]
                    conf   = float(box.conf[0])
                    x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]

                    # Include if it's a known weapon OR any object (demo mode)
                    is_weapon = label in self.WEAPON_CLASSES or cls_id in self.COCO_WEAPON_IDS
                    detections.append({
                        "label":       label,
                        "is_weapon":   is_weapon,
                        "confidence":  round(conf, 4),
                        "box":         [x1, y1, x2, y2],
                        "class_id":    cls_id,
                    })

            # Sort by confidence descending
            detections.sort(key=lambda d: d["confidence"], reverse=True)

            return {
                "status":       "success",
                "model":        "YOLOv8n (COCO)",
                "total_objects": len(detections),
                "weapons_found": sum(1 for d in detections if d["is_weapon"]),
                "detections":   detections
            }

        except Exception as e:
            logger.error(f"WeaponDetector error: {traceback.format_exc()}")
            return {"status": "error", "message": str(e), "detections": []}
