import cv2
import os
import logging
import numpy as np

logger = logging.getLogger("forensix.ai.footprint")


class FootprintMatcher:
    """
    ORB (Oriented FAST and Rotated BRIEF) feature-based footprint matcher.
    Compares input image against a local tread database at storage/treads/.
    """

    def __init__(self, db_path: str = "storage/treads", min_matches: int = 10, threshold: float = 65.0):
        self.orb         = cv2.ORB_create(nfeatures=1500)
        self.matcher     = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        self.db_path     = db_path
        self.min_matches = min_matches
        self.threshold   = threshold
        os.makedirs(db_path, exist_ok=True)
        logger.info(f"FootprintMatcher: database → {db_path}")

    def match(self, image: np.ndarray) -> dict:
        gray1 = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray1 = cv2.equalizeHist(gray1)          # normalise lighting
        kp1, des1 = self.orb.detectAndCompute(gray1, None)

        if des1 is None or len(kp1) < 5:
            return {
                "status": "success",
                "match": False,
                "similarity": 0.0,
                "best_match": None,
                "keypoints_detected": len(kp1) if kp1 else 0,
                "message": "Too few keypoints in evidence image"
            }

        db_files = [f for f in os.listdir(self.db_path) if f.lower().endswith((".jpg", ".jpeg", ".png", ".bmp"))]

        if not db_files:
            return {
                "status": "success",
                "match": False,
                "similarity": 0.0,
                "best_match": None,
                "keypoints_detected": len(kp1),
                "message": "Tread database is empty — add reference images to storage/treads/"
            }

        best_score = 0.0
        best_file  = None
        all_scores = {}

        for fname in db_files:
            path   = os.path.join(self.db_path, fname)
            db_img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
            if db_img is None:
                continue
            db_img = cv2.equalizeHist(db_img)
            kp2, des2 = self.orb.detectAndCompute(db_img, None)
            if des2 is None or len(kp2) < 5:
                continue

            matches = self.matcher.match(des1, des2)
            if len(matches) < self.min_matches:
                continue
            matches.sort(key=lambda m: m.distance)
            good = matches[:50]

            avg_dist = np.mean([m.distance for m in good])
            score    = max(0.0, 100.0 * (1.0 - avg_dist / 256.0))
            all_scores[fname] = round(score, 2)

            if score > best_score:
                best_score = score
                best_file  = fname

        matched = best_score >= self.threshold
        return {
            "status":            "success",
            "match":             matched,
            "similarity":        round(best_score, 2),
            "best_match":        best_file if matched else None,
            "keypoints_detected": len(kp1),
            "database_size":     len(db_files),
            "all_scores":        all_scores,
        }
