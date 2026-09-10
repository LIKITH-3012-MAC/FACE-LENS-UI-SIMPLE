import base64
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend.database.repository import repo

client = TestClient(app)

def test_validate_preview_no_face():
    """Verify preview validation endpoint rejects frame with no faces."""
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", blank)
    b64 = base64.b64encode(buf).decode("utf-8")

    res = client.post("/api/camera/validate-preview", json={"image_base64": b64})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["data"]["is_valid"] is False
    assert data["data"]["reason"] == "no_face"

def test_image_quality_blur_and_brightness():
    """Verify Laplacian variance and brightness computation functions correctly."""
    # A flat gray image has 0 variance (blurry)
    flat_gray = np.ones((200, 200), dtype=np.uint8) * 128
    laplacian_var = float(cv2.Laplacian(flat_gray, cv2.CV_64F).var())
    mean_brightness = float(np.mean(flat_gray))

    assert laplacian_var == 0.0
    assert mean_brightness == 128.0

    # A textured image has high variance
    np.random.seed(42)
    textured = np.random.randint(0, 255, (200, 200), dtype=np.uint8)
    textured_var = float(cv2.Laplacian(textured, cv2.CV_64F).var())
    assert textured_var > 100.0

def test_get_all_face_encodings_query():
    """Verify repository can query all registered face encodings without error."""
    encodings = repo.get_all_face_encodings()
    assert isinstance(encodings, list)
    for row in encodings:
        assert "student_id" in row
        assert "name" in row
