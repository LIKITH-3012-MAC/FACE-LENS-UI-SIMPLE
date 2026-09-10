import logging
from typing import Optional, Tuple
import cv2
import numpy as np
from backend.config import settings

logger = logging.getLogger("smart_attendance.camera_service")

class CameraManager:
    """
    Manages OpenCV camera lifecycle, video capture device initialization,
    frame acquisition, and clean release.
    """
    def __init__(self, camera_index: Optional[int] = None):
        self.camera_index = camera_index if camera_index is not None else settings.CAMERA_INDEX
        self.cap: Optional[cv2.VideoCapture] = None

    def open(self) -> bool:
        """Attempt to open the camera device."""
        if self.cap is not None and self.cap.isOpened():
            return True

        try:
            self.cap = cv2.VideoCapture(self.camera_index)
            if self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                logger.info(f"Camera opened at index {self.camera_index}.")
                return True
            else:
                logger.warning(f"Could not open camera at index {self.camera_index}.")
                self.cap = None
                return False
        except Exception as e:
            logger.error(f"Error opening camera: {e}")
            self.cap = None
            return False

    def read_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """Read a single frame from the camera."""
        if self.cap is None or not self.cap.isOpened():
            if not self.open():
                return False, None

        ret, frame = self.cap.read()
        if not ret or frame is None:
            return False, None
        return True, frame

    def release(self):
        """Release the camera device cleanly."""
        if self.cap is not None:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None
            logger.info("Camera released.")

    def is_available(self) -> bool:
        """Check if camera hardware is responsive."""
        if self.open():
            ret, frame = self.read_frame()
            self.release()
            return ret and frame is not None
        return False

camera_manager = CameraManager()
