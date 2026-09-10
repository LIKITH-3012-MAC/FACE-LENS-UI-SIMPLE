import hashlib
import logging
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple
from zoneinfo import ZoneInfo
import bcrypt
import jwt

from backend.config import settings
from backend.database.connection import execute_query
from backend.services.email_service import email_service

logger = logging.getLogger("smart_attendance.auth")

JWT_SECRET = "sakra_lens_production_super_jwt_secret_key_2026"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
OTP_EXPIRATION_MINUTES = 3
MAX_OTP_ATTEMPTS = 5

class AuthService:
    """
    Complete authentication & role-based authorization service for Sakra-Lens.
    Manages:
    - Argon2/Bcrypt password hashing
    - Cryptographically secure 6-digit OTP generation
    - SHA-256 OTP hashing with single-use enforcement
    - 3-minute OTP expiry & previous OTP invalidation
    - Role authorization (user vs admin)
    - Audit log generation
    """

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash plaintext password using bcrypt with random salt."""
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against bcrypt hash."""
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False

    @staticmethod
    def _hash_otp(otp_str: str, email: str) -> str:
        """Hash OTP with email salt using SHA-256 for secure database storage."""
        combined = f"{otp_str.strip()}:{email.strip().lower()}:sakra_salt"
        return hashlib.sha256(combined.encode("utf-8")).hexdigest()

    @staticmethod
    def generate_otp() -> str:
        """Generate cryptographically secure 6-digit numeric OTP."""
        return f"{secrets.randbelow(900000) + 100000:06d}"

    @staticmethod
    def create_token(user_data: Dict[str, Any]) -> str:
        """Create signed JWT session token."""
        exp = datetime.now(ZoneInfo("UTC")) + timedelta(hours=JWT_EXPIRATION_HOURS)
        payload = {
            "sub": user_data["email"],
            "name": user_data.get("full_name", ""),
            "role": user_data.get("role", "user"),
            "exp": exp
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate JWT session token."""
        try:
            return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except Exception:
            return None

    @classmethod
    def log_audit(cls, user_email: Optional[str], action: str, details: str = "", ip_address: Optional[str] = None):
        """Append record to audit_logs table for administrative accountability."""
        try:
            execute_query(
                "INSERT INTO audit_logs (user_email, action, details, ip_address) VALUES (%s, %s, %s, %s)",
                (user_email, action, details, ip_address),
                commit=True
            )
        except Exception as e:
            logger.warning(f"Failed to record audit log: {e}")

    @classmethod
    def request_registration_otp(cls, email: str, full_name: str, ip_address: Optional[str] = None) -> Tuple[bool, str]:
        """
        Initiate new account registration:
        1. Verifies email is not already registered.
        2. Invalidates any existing unverified OTPs for this email.
        3. Generates 6-digit OTP with 3-minute expiry.
        4. Hashes OTP and stores in MySQL.
        5. Dispatches Resend verification email.
        """
        email_clean = email.strip().lower()

        # Check if user already exists
        existing = execute_query("SELECT id FROM users WHERE email = %s", (email_clean,), fetchone=True)
        if existing:
            return False, "An account with this email address already exists. Please log in."

        # Invalidate previous unused OTPs for this email
        execute_query("UPDATE otp_verifications SET is_used = TRUE WHERE email = %s AND is_used = FALSE", (email_clean,), commit=True)

        otp = cls.generate_otp()
        otp_hash = cls._hash_otp(otp, email_clean)
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        expires_at = now + timedelta(minutes=OTP_EXPIRATION_MINUTES)
        expires_str = expires_at.strftime("%Y-%m-%d %H:%M:%S")

        execute_query(
            """
            INSERT INTO otp_verifications (email, otp_hash, purpose, attempts, is_used, expires_at)
            VALUES (%s, %s, 'registration', 0, FALSE, %s)
            """,
            (email_clean, otp_hash, expires_str),
            commit=True
        )

        cls.log_audit(email_clean, "OTP_REQUESTED", f"Registration OTP dispatched to {email_clean}", ip_address)

        # Dispatch via Resend
        ok, msg, resend_id = email_service.send_otp_email(
            email=email_clean,
            otp=otp,
            full_name=full_name,
            purpose="Account Registration"
        )

        if not ok:
            return False, f"Could not dispatch verification email: {msg}"

        return True, f"A 6-digit verification code has been sent to {email_clean}. It expires in 3 minutes."

    @classmethod
    def verify_otp_and_register(
        cls,
        email: str,
        otp: str,
        password: str,
        full_name: str,
        ip_address: Optional[str] = None
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Verify OTP and finalize new account creation.
        Enforces:
        - 3-minute expiry check
        - Attempt counter (< 5)
        - Single-use invalidation
        - Bcrypt password hashing
        """
        email_clean = email.strip().lower()
        if len(password) < 6:
            return False, "Password must be at least 6 characters long.", None

        # Fetch latest active OTP record for this email
        otp_row = execute_query(
            """
            SELECT id, otp_hash, attempts, is_used, expires_at
            FROM otp_verifications
            WHERE email = %s AND is_used = FALSE
            ORDER BY id DESC LIMIT 1
            """,
            (email_clean,),
            fetchone=True
        )

        if not otp_row:
            return False, "No active verification code found. Please request a new OTP.", None

        # Check attempt limit
        if otp_row.get("attempts", 0) >= MAX_OTP_ATTEMPTS:
            execute_query("UPDATE otp_verifications SET is_used = TRUE WHERE id = %s", (otp_row["id"],), commit=True)
            cls.log_audit(email_clean, "OTP_LOCKED", "Exceeded maximum verification attempts", ip_address)
            return False, "Maximum attempts exceeded. Please request a new OTP.", None

        # Check expiration
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        exp_val = otp_row.get("expires_at")
        if isinstance(exp_val, str):
            exp_time = datetime.strptime(exp_val, "%Y-%m-%d %H:%M:%S").replace(tzinfo=ZoneInfo("Asia/Kolkata"))
        elif isinstance(exp_val, datetime):
            exp_time = exp_val.replace(tzinfo=ZoneInfo("Asia/Kolkata")) if not exp_val.tzinfo else exp_val
        else:
            exp_time = now - timedelta(seconds=1)

        if now > exp_time:
            execute_query("UPDATE otp_verifications SET is_used = TRUE WHERE id = %s", (otp_row["id"],), commit=True)
            cls.log_audit(email_clean, "OTP_EXPIRED", "Submitted expired verification code", ip_address)
            return False, "Verification code has expired (3-minute limit). Please request a new one.", None

        # Check OTP match
        input_hash = cls._hash_otp(otp, email_clean)
        if input_hash != otp_row.get("otp_hash"):
            new_attempts = otp_row.get("attempts", 0) + 1
            execute_query("UPDATE otp_verifications SET attempts = %s WHERE id = %s", (new_attempts, otp_row["id"]), commit=True)
            remaining = MAX_OTP_ATTEMPTS - new_attempts
            return False, f"Invalid verification code. {remaining} attempt(s) remaining.", None

        # Invalidate OTP on success
        execute_query("UPDATE otp_verifications SET is_used = TRUE WHERE id = %s", (otp_row["id"],), commit=True)

        # Hash password and insert user
        pwd_hash = cls.hash_password(password)
        new_user_id = execute_query(
            """
            INSERT INTO users (email, password_hash, full_name, role, is_verified)
            VALUES (%s, %s, %s, 'user', TRUE)
            """,
            (email_clean, pwd_hash, full_name.strip()),
            commit=True
        )

        user_data = {
            "id": new_user_id,
            "email": email_clean,
            "full_name": full_name.strip(),
            "role": "user"
        }
        token = cls.create_token(user_data)
        cls.log_audit(email_clean, "USER_REGISTERED", f"Account created successfully for {full_name}", ip_address)

        return True, "Account registered successfully!", {"user": user_data, "token": token}

    @classmethod
    def login(cls, email: str, password: str, ip_address: Optional[str] = None) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """Authenticate existing user credentials."""
        email_clean = email.strip().lower()
        user = execute_query("SELECT * FROM users WHERE email = %s", (email_clean,), fetchone=True)
        if not user:
            cls.log_audit(email_clean, "LOGIN_FAILED", "User not found", ip_address)
            return False, "Invalid email address or password.", None

        if not cls.verify_password(password, user["password_hash"]):
            cls.log_audit(email_clean, "LOGIN_FAILED", "Incorrect password", ip_address)
            return False, "Invalid email address or password.", None

        user_data = {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
        token = cls.create_token(user_data)
        cls.log_audit(email_clean, "LOGIN_SUCCESS", f"User logged in ({user['role']})", ip_address)

        return True, "Login successful", {"user": user_data, "token": token}

auth_service = AuthService()
