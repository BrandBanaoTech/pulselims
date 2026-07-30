# app/core/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

# 🛡️ get_remote_address automatically inspects 'X-Forwarded-For' headers
# This ensures it reads the actual user's IP, not Render's internal load balancer IP.
limiter = Limiter(key_func=get_remote_address)

def get_client_ip(request: Request) -> str:
    """Helper function to extract the real IP for audit logging."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "Unknown"