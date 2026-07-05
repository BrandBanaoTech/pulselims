from app.core.database import SessionLocal
from ..schemas.auth import TokenPayload
import jwt
import uuid
from fastapi import Depends, HTTPException, status, Path
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import ValidationError
from typing import Generator
from app.core.config import settings



# FastAPI utility that automatically extracts the "Bearer <token>" from the Authorization header
# oauth2_scheme = OAuth2PasswordBearer(
#     tokenUrl="/api/v1/auth/login", 
#     scheme_name="JWT"
# )
oauth2_scheme = HTTPBearer(
    scheme_name="JWT"
)



# CORE AUTHENTICATION DEPENDENCY
def get_current_token_payload(token: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> TokenPayload:
    """
    Validates the JWT and returns the parsed TokenPayload schema.
    This guarantees the user is logged in, but does NOT check lab-specific permissions.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the token (automatically verifies expiration)
        token_string = token.credentials
        payload = jwt.decode(token_string, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Load the raw dictionary into our strict Pydantic V2 schema
        token_data = TokenPayload(**payload)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValidationError as e:
        print(f"\n🚨 PYDANTIC ERROR: {e}\n") # Helps debug if your token payload is missing a field
        raise credentials_exception
    except jwt.PyJWTError as e:
        print(f"\n🚨 JWT ERROR: {e}\n") # Helps debug if the signature doesn't match
        raise credentials_exception
        
    return token_data


# ---------------------------------------------------------
# TENANT-SCOPED AUTHORIZATION DEPENDENCY (RBAC)
# ---------------------------------------------------------
def require_lab_permission(required_permission: str):
    """
    A dependency factory that checks if the logged-in user has the specific permission 
    for the lab they are trying to access.
    
    Usage in a route:
    @router.get("/labs/{lab_id}/reports")
    def get_reports(lab_id: UUID4, auth: TokenPayload = Depends(require_lab_permission("read_only"))):
    """
    def permission_checker(
        # Extracts the lab_id directly from the URL path
        lab_id: uuid.UUID = Path(..., description="The UUID of the lab tenant"),
        token_payload: TokenPayload = Depends(get_current_token_payload)
    ) -> TokenPayload:
        
        # Convert UUID to string to match our JWT dictionary keys
        str_lab_id = str(lab_id)
        
        # Fast memory check: O(1) dictionary lookup (No database query required!)
        user_perms_for_lab = token_payload.lab_permissions.get(str_lab_id, [])
        
        # The master 'owner' always has implicit access. Otherwise, check explicit permission.
        if required_permission not in user_perms_for_lab and "owner" not in user_perms_for_lab:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Missing '{required_permission}' clearance for this lab."
            )
            
        return token_payload

    return permission_checker