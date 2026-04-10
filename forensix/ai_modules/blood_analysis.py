import cv2
import numpy as np
import logging

logger = logging.getLogger("forensix.ai.blood")


class BloodAnalyzer:
    """
    HSV-based blood spatter pattern classifier using OpenCV.
    Classifies: Impact, Cast-off, Passive Drip, Transfer, or None.
    """

    # Broader red ranges for dried/darkened blood
    HSV_RANGES = [
        (np.array([0, 50, 30]),   np.array([12, 255, 255])),
        (np.array([168, 50, 30]), np.array([180, 255, 255])),
    ]

    def analyze(self, image: np.ndarray) -> dict:
        hsv  = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        mask = np.zeros(hsv.shape[:2], dtype=np.uint8)

        for lo, hi in self.HSV_RANGES:
            mask |= cv2.inRange(hsv, lo, hi)

        # Morphological clean-up
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask   = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel, iterations=1)
        mask   = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return {
                "status": "success",
                "pattern": "None detected",
                "spots_count": 0,
                "average_size": 0.0,
                "total_area_px": 0,
                "coverage_pct": 0.0,
            }

        img_area   = image.shape[0] * image.shape[1]
        areas      = [cv2.contourArea(c) for c in contours if cv2.contourArea(c) > 4]
        total_area = sum(areas)
        coverage   = 100.0 * total_area / img_area if img_area > 0 else 0.0
        avg_size   = float(np.mean(areas)) if areas else 0.0
        count      = len(areas)

        # Classify pattern
        pattern = self._classify(count, avg_size, coverage)

        # Detailed region list (top 10)
        regions = []
        for c in sorted(contours, key=cv2.contourArea, reverse=True)[:10]:
            area = cv2.contourArea(c)
            if area < 4:
                continue
            x, y, w, h = cv2.boundingRect(c)
            regions.append({"x": x, "y": y, "w": w, "h": h, "area": round(area, 1)})

        return {
            "status":        "success",
            "pattern":       pattern,
            "spots_count":   count,
            "average_size":  round(avg_size, 2),
            "total_area_px": int(total_area),
            "coverage_pct":  round(coverage, 4),
            "top_regions":   regions,
        }

    @staticmethod
    def _classify(count: int, avg_size: float, coverage: float) -> str:
        if count == 0:
            return "None detected"
        if count >= 50 and avg_size < 30:
            return "High-Velocity Impact Spatter"
        if count >= 15 and avg_size < 80:
            return "Medium-Velocity Impact Spatter"
        if count >= 5 and avg_size > 200:
            return "Cast-off Pattern"
        if count < 5 and avg_size > 400:
            return "Passive Drip / Contact Transfer"
        if coverage > 5.0:
            return "Large Volume Pooling"
        return "Low-Velocity / Passive Drip Pattern"
