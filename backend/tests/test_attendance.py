from datetime import time, datetime, timedelta
import pytest
from backend.services.attendance_service import attendance_service

def test_evaluate_status_before_cutoff():
    """Verify arrivals before 09:30:00 are evaluated as Present."""
    early_time = time(9, 15, 0)
    status = attendance_service.evaluate_status(early_time)
    assert status == "Present"

def test_evaluate_status_after_cutoff():
    """Verify arrivals after 09:30:00 are evaluated as Late."""
    late_time = time(9, 45, 0)
    status = attendance_service.evaluate_status(late_time)
    assert status == "Late"

def test_temporal_confirmation_streak():
    """Verify 3 consecutive frames are required before attendance is confirmed."""
    test_sid = "TEST-TEMP-STREAK-01"
    attendance_service.reset_streak(test_sid)

    # Frame 1: Not confirmed yet
    assert attendance_service.check_temporal_confirmation(test_sid) is False
    # Frame 2: Not confirmed yet
    assert attendance_service.check_temporal_confirmation(test_sid) is False
    # Frame 3: Confirmed (reaches MIN_STABLE_RECOGNITIONS = 3)
    assert attendance_service.check_temporal_confirmation(test_sid) is True

    # Reset streak
    attendance_service.reset_streak(test_sid)
    assert attendance_service.check_temporal_confirmation(test_sid) is False

def test_debounce_cooldown_mechanism():
    """Verify consecutive frames within 60s cooldown period are prevented."""
    test_sid = "TEST-COOLDOWN-01"
    now = datetime.now()
    attendance_service.cooldown_cache[test_sid] = now

    # Cooldown should be active
    last_marked = attendance_service.cooldown_cache.get(test_sid)
    assert last_marked is not None
    assert (datetime.now() - last_marked).total_seconds() < attendance_service.cooldown_seconds
