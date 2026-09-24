import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent

os.environ["OPENCV_AVFOUNDATION_SKIP_AUTH"] = "1"

import sys

# Support external python packages if installed in anaconda site-packages
for extra_path in ["/opt/anaconda3/lib/python3.13/site-packages", "/opt/homebrew/lib/python3.13/site-packages"]:
    if os.path.exists(extra_path) and extra_path not in sys.path:
        sys.path.insert(0, extra_path)

class Settings(BaseSettings):
    # Cloud MySQL Database Settings (Loaded from backend/.env)
    DB_HOST: str = ""
    DB_PORT: int = 3306
    DB_NAME: str = "smart_attendance"
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_SSL_DISABLED: bool = False
    DB_POOL_NAME: str = "attendance_pool"
    DB_POOL_SIZE: int = 5

    # Face Quality & Capture Validation
    MIN_FACE_WIDTH: int = 70
    MIN_FACE_HEIGHT: int = 70
    MIN_BRIGHTNESS: float = 30.0
    MAX_BRIGHTNESS: float = 235.0
    MIN_BLUR_VARIANCE: float = 10.0

    # 128-D Face Recognition Parameters
    FACE_ENCODING_TOLERANCE: float = 0.50
    FACE_RECOGNITION_DEBUG: bool = True
    MIN_STABLE_RECOGNITIONS: int = 3

    # Paths & Directory Roots
    DATASET_ROOT: str = ""
    DATASET_DIR: Path = BASE_DIR / "dataset"
    MODELS_DIR: Path = BASE_DIR / "models"
    CAMERA_INDEX: int = 0

    @property
    def dataset_path(self) -> Path:
        """Returns configured DATASET_ROOT path, with fallback to DATASET_DIR if inaccessible."""
        if self.DATASET_ROOT:
            p = Path(self.DATASET_ROOT)
            try:
                p.mkdir(parents=True, exist_ok=True)
                test_dir = p / ".write_probe"
                test_dir.mkdir(exist_ok=True)
                test_dir.rmdir()
                return p
            except Exception:
                pass
        fallback = self.DATASET_DIR
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback

    # Attendance Policy
    ATTENDANCE_CUTOFF_TIME: str = "09:30:00"

    # CORS & Server
    FRONTEND_URL: str = "https://face-lens-ui-simple.vercel.app"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Resend Email Configuration (Loaded from backend/.env)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "Sakra-Lens <noreply@yourdomain.com>"
    TIMEZONE: str = "Asia/Kolkata"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
settings.DATASET_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
