import cv2
import os
import logging
import numpy as np

logger = logging.getLogger("forensix.ai.facerec")


class FaceRecognizer:
    """
    face_recognition library wrapper.
    Lazily loads on first use — prevents import crash if dlib is missing.
    Known suspect encodings are loaded from storage/faces/ (one image per person,
    filename is the suspect identity label).
    """

    def __init__(self, faces_dir: str = "storage/faces", tolerance: float = 0.5):
        self.faces_dir  = faces_dir
        self.tolerance  = tolerance
        self._fr        = None
        self._encodings = []
        self._names     = []
        self._loaded    = False
        os.makedirs(faces_dir, exist_ok=True)

    # ── Lazy initialiser ───────────────────────────────────────────────────────
    def _init(self):
        if self._loaded:
            return
        try:
            import face_recognition
            self._fr = face_recognition
            self._load_db()
            self._loaded = True
            logger.info(f"FaceRecognizer: loaded {len(self._names)} suspect(s) from {self.faces_dir}")
        except ImportError:
            logger.warning("face_recognition not installed — face module disabled")
            self._loaded = True   # Prevent repeated attempts

    def _load_db(self):
        for fname in os.listdir(self.faces_dir):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            name = os.path.splitext(fname)[0].replace("_", " ").title()
            img  = self._fr.load_image_file(os.path.join(self.faces_dir, fname))
            encs = self._fr.face_encodings(img)
            if encs:
                self._encodings.append(encs[0])
                self._names.append(name)

    # ── Public API ─────────────────────────────────────────────────────────────
    def recognize(self, image: np.ndarray) -> dict:
        self._init()

        if self._fr is None:
            return {
                "status": "unavailable",
                "message": "face_recognition library not available",
                "faces": []
            }

        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        locations  = self._fr.face_locations(rgb, model="hog")
        encodings  = self._fr.face_encodings(rgb, locations)

        results = []
        for (top, right, bottom, left), enc in zip(locations, encodings):
            name       = "Unknown Suspect"
            confidence = 0.0

            if self._encodings:
                distances  = self._fr.face_distance(self._encodings, enc)
                best_idx   = int(np.argmin(distances))
                best_dist  = distances[best_idx]
                if best_dist <= self.tolerance:
                    name       = self._names[best_idx]
                    confidence = round(100.0 * (1.0 - best_dist), 2)

            results.append({
                "name":       name,
                "confidence": confidence,
                "box":        [left, top, right, bottom],
                "matched":    name != "Unknown Suspect"
            })

        return {
            "status":          "success",
            "faces_detected":  len(results),
            "suspects_in_db":  len(self._names),
            "faces":           results,
        }
