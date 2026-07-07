import jwt
import uuid
from typing import Callable
from fastapi import Depends, HTTPException, status, Path
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import ValidationError

# Adjust imports to match your project structure
from ..core.config import settings
from ..core.database import get_db
from ..schemas.auth import TokenPayload
from ..models.labmembership import LabMembership, MembershipStatus

# ==========================================
# OPENAPI / SWAGGER UI CONFIGURATION
# ==========================================
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login", 
    scheme_name="JWT"
)

# ==========================================
# CORE AUTHENTICATION DEPENDENCY
# ==========================================
def get_current_token_payload(token: str = Depends(oauth2_scheme)) -> TokenPayload:
    """
    Validates the JWT and returns the parsed TokenPayload schema.
    Guarantees the user is logged in, but does NOT check lab-specific permissions.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the token (automatically verifies expiration via the 'exp' claim)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Load the raw dictionary into our strict Pydantic V2 schema
        token_data = TokenPayload(**payload)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValidationError as e:
        print(f"\n🚨 PYDANTIC ERROR: {e}\n") 
        raise credentials_exception
    except jwt.PyJWTError as e:
        print(f"\n🚨 JWT ERROR: {e}\n") 
        raise credentials_exception
        
    return token_data


# ==========================================
# TENANT-SCOPED RBAC DEPENDENCY FACTORY
# ==========================================
def require_lab_permission(required_permission: str) -> Callable:
    """
    Dependency Factory: Returns a dependency function that checks if the 
    authenticated user has the required permission within a specific lab.
    """
    def permission_checker(
        # FastAPI natively extracts and validates the UUID from the URL path!
        lab_id: uuid.UUID = Path(..., description="The UUID of the laboratory"),
        db: Session = Depends(get_db),
        token_payload: TokenPayload = Depends(get_current_token_payload)
    ) -> TokenPayload:
        
        user_uuid = uuid.UUID(token_payload.sub)

        # ⚡ FAST QUERY: Look up the exact membership record in PostgreSQL
        stmt = select(LabMembership).where(
            LabMembership.user_id == user_uuid,
            LabMembership.lab_id == lab_id
        )
        membership = db.execute(stmt).scalars().first()

        # 🛡️ SECURITY CHECKS (Zero-Trust Architecture)
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this laboratory."
            )
        
        # Extract permissions once for efficiency
        user_permissions = membership.permissions or []
        is_owner = "owner" in user_permissions
            
        # 🔓 THE OWNER OVERRIDE: 
        # Only block access if the user is NOT an owner AND the membership is NOT active.
        if membership.status != MembershipStatus.ACTIVE:
            if not is_owner:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Your membership status is {membership.status.value}."
                )

        # 🔑 PERMISSION VERIFICATION
        if not is_owner and required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You lack the required permission ('{required_permission}') to perform this action."
            )

        # Return the payload so the router can use the user's ID
        return token_payload

    return permission_checker