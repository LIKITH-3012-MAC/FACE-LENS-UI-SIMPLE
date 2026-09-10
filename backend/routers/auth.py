import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Header, status
from pydantic import BaseModel, EmailStr, Field

from backend.services.auth_service import auth_service
from backend.utils.network import get_client_ip
from backend.schemas.common import ApiResponse

logger = logging.getLogger("smart_attendance.auth_router")
router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])

class OTPRequestSchema(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)

class OTPVerifyRegisterSchema(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

@router.post("/register-request-otp", response_model=ApiResponse[dict])
def request_registration_otp(payload: OTPRequestSchema, request: Request):
    """
    Step 1: Request 6-digit OTP for new user registration.
    Enforces email uniqueness, 3-minute expiration, and dispatches Resend notification.
    """
    client_ip = get_client_ip(request)
    ok, msg = auth_service.request_registration_otp(payload.email, payload.full_name, client_ip)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return ApiResponse(success=True, message=msg, data={"email": payload.email})

@router.post("/verify-otp-register", response_model=ApiResponse[dict])
def verify_otp_and_register(payload: OTPVerifyRegisterSchema, request: Request):
    """
    Step 2: Verify 6-digit OTP and set account password.
    Enforces attempt limit, single-use invalidation, and bcrypt password hashing.
    """
    client_ip = get_client_ip(request)
    ok, msg, data = auth_service.verify_otp_and_register(
        email=payload.email,
        otp=payload.otp,
        password=payload.password,
        full_name=payload.full_name,
        ip_address=client_ip
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return ApiResponse(success=True, message=msg, data=data)

@router.post("/login", response_model=ApiResponse[dict])
def login(payload: LoginSchema, request: Request):
    """Authenticate existing user and return signed session token."""
    client_ip = get_client_ip(request)
    ok, msg, data = auth_service.login(payload.email, payload.password, client_ip)
    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)
    return ApiResponse(success=True, message=msg, data=data)

@router.post("/admin/login", response_model=ApiResponse[dict])
def admin_login(payload: LoginSchema, request: Request):
    """Authenticate administrator with strict role verification."""
    client_ip = get_client_ip(request)
    ok, msg, data = auth_service.login(payload.email, payload.password, client_ip)
    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)
    if data["user"]["role"] != "admin":
        auth_service.log_audit(payload.email, "ADMIN_ACCESS_DENIED", "Non-admin attempted admin login", client_ip)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Administrator privileges required.")
    return ApiResponse(success=True, message="Administrator authenticated successfully", data=data)

@router.get("/me", response_model=ApiResponse[dict])
def get_current_user(authorization: Optional[str] = Header(None)):
    """Validate current session token and retrieve user profile."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    token = authorization.split(" ")[1]
    payload = auth_service.decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or token invalid")
    return ApiResponse(success=True, message="Session valid", data=payload)
