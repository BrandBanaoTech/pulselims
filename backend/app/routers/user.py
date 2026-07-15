from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..api.deps import get_current_active_user
from ..schemas.auth import UserResponse
from ..models.user import User

router = APIRouter(prefix="/users")

# ==========================================
# 1. THE LIGHTNING PING (Session Verification)
# ==========================================
@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def read_users_me(
    # This single line handles JWT validation, DB lookup, AND active status check
    current_user: User = Depends(get_current_active_user)
):
    """
    Frontend Session Ping: 
    Returns the current user's profile. If the user was deactivated 5 seconds ago,
    this will instantly throw a 403 Forbidden, forcing the frontend to log them out.
    """
    return current_user