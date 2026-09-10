import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, status

from backend.database.connection import execute_query
from backend.services.auth_service import auth_service
from backend.schemas.common import ApiResponse

logger = logging.getLogger("smart_attendance.admin")
router = APIRouter(prefix="/api/admin", tags=["Administrator Operations"])

def require_admin(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency enforcing administrator role authorization."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required")
    token = authorization.split(" ")[1]
    payload = auth_service.decode_token(token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Administrator role required."
        )
    return payload

@router.get("/overview", response_model=ApiResponse[dict])
def get_admin_overview(authorization: Optional[str] = Header(None)):
    """Retrieve comprehensive system overview for administrators."""
    require_admin(authorization)

    # User counts
    users_cnt = execute_query("SELECT COUNT(*) as c FROM users", fetchone=True)
    # Student counts
    students_cnt = execute_query("SELECT COUNT(*) as c FROM students", fetchone=True)
    # Attendance counts
    attendance_cnt = execute_query("SELECT COUNT(*) as c FROM attendance", fetchone=True)
    today_cnt = execute_query("SELECT COUNT(*) as c FROM attendance WHERE attendance_date = CURDATE()", fetchone=True)
    # Recent audit logs
    recent_audits = execute_query("SELECT id, user_email, action, details, ip_address, created_at FROM audit_logs ORDER BY id DESC LIMIT 20", fetchall=True) or []

    return ApiResponse(
        success=True,
        message="Admin overview retrieved",
        data={
            "total_users": users_cnt.get("c", 0) if users_cnt else 0,
            "total_students": students_cnt.get("c", 0) if students_cnt else 0,
            "total_attendance_records": attendance_cnt.get("c", 0) if attendance_cnt else 0,
            "today_attendance": today_cnt.get("c", 0) if today_cnt else 0,
            "recent_audit_logs": recent_audits
        }
    )

@router.get("/audit-logs", response_model=ApiResponse[list])
def get_audit_logs(authorization: Optional[str] = Header(None)):
    """Retrieve detailed security and system audit logs."""
    require_admin(authorization)
    logs = execute_query("SELECT id, user_email, action, details, ip_address, created_at FROM audit_logs ORDER BY id DESC LIMIT 100", fetchall=True) or []
    return ApiResponse(success=True, message="Audit logs retrieved", data=logs)

@router.get("/users", response_model=ApiResponse[list])
def get_all_users(authorization: Optional[str] = Header(None)):
    """List all registered system users with verification and role status."""
    require_admin(authorization)
    users = execute_query("SELECT id, email, full_name, role, is_verified, created_at FROM users ORDER BY id DESC", fetchall=True) or []
    return ApiResponse(success=True, message="Users retrieved", data=users)
