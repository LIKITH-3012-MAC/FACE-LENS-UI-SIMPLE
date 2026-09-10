import ipaddress
import logging
from typing import Optional
from fastapi import Request

logger = logging.getLogger("smart_attendance.network")

def get_client_ip(request: Request) -> str:
    """
    Safely determine the client IP address from FastAPI request.
    Does not blindly trust arbitrary X-Forwarded-For headers unless
    direct peer is local loopback/proxy.
    """
    try:
        direct_ip = request.client.host if request.client else "127.0.0.1"

        # Check if direct peer is loopback or local network
        is_loopback = False
        try:
            ip_obj = ipaddress.ip_address(direct_ip)
            is_loopback = ip_obj.is_loopback or ip_obj.is_private
        except ValueError:
            pass

        if is_loopback:
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                # Take the first untrusted client IP in chain
                candidate = forwarded.split(",")[0].strip()
                try:
                    ipaddress.ip_address(candidate)
                    return candidate
                except ValueError:
                    pass

            real_ip = request.headers.get("X-Real-IP")
            if real_ip:
                candidate = real_ip.strip()
                try:
                    ipaddress.ip_address(candidate)
                    return candidate
                except ValueError:
                    pass

        return direct_ip
    except Exception as e:
        logger.warning(f"Error determining client IP: {e}")
        return "127.0.0.1"
