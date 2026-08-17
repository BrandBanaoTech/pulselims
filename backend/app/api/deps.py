import uuid
import logging
from typing import Callable, Dict, Any
from fastapi import Depends, HTTPException, status, Request, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import ValidationError

from ..core.config import settings
from ..core.database import get_db
from ..core.security import decode_access_token
from ..schemas.auth import TokenPayload
from ..models.user import User
from ..models.lab import Lab
from ..models.labmembership import LabMembership, MembershipStatus

logger = logging.getLogger(__name__)

# ==========================================
# OPENAPI / SWAGGER UI CONFIGURATION
# ==========================================
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/swagger-login", 
    scheme_name="JWT"
)

# ==========================================
# CORE AUTHENTICATION DEPENDENCY
# ==========================================
def get_current_token_payload(token: str = Depends(oauth2_scheme)) -> TokenPayload:
    """Validates the Bearer JWT and converts it into a typed TokenPayload object."""
    raw_payload = decode_access_token(token)
    try:
        return TokenPayload(**raw_payload)
    except ValidationError as e:
        logger.error(f"Malformed Token Payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid security token structure.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ==========================================
# ACTIVE USER VERIFICATION (Anti-Zombie Token)
# ==========================================
def get_current_user(
    db: Session = Depends(get_db),
    token_payload: TokenPayload = Depends(get_current_token_payload)
) -> User:
    """Verifies that the user identified in the JWT physically exists."""
    try:
        user_uuid = uuid.UUID(token_payload.sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format.")
    
    user = db.execute(select(User).where(User.id == user_uuid)).scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist."
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    🛡️ ENTERPRISE SESSION BOUNCER
    Differentiates between User-level and Lab-level deactivations and passes 
    structured JSON error codes to the frontend.
    """
    # SCENARIO 1: USER DEACTIVATED
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "USER_DEACTIVATED",
                "message": "Your personal account has been disabled."
            }
        )

    # SCENARIO 2: LAB DEACTIVATED OR DELETED
    if current_user.default_lab_id:
        lab_status = db.execute(
            select(Lab.is_active).where(Lab.id == current_user.default_lab_id)
        ).scalar()
        
        # Hard-Deleted from DB (Will return None)
        if lab_status is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "LAB_DELETED",
                    "message": "The workspace you belong to no longer exists."
                }
            )
            
        # Soft-Deleted/Suspended (Will return False)
        if lab_status is False:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "LAB_SUSPENDED",
                    "message": "Your workspace has been suspended by the platform administrator."
                }
            )

    return current_user


# ==========================================
# TENANT-SCOPED RBAC DEPENDENCY FACTORY
# ==========================================
def require_lab_permission(required_permission: str) -> Callable:
    """Dependency Factory: Validates contextual permissions for the user's default lab."""
    def permission_checker(
        db: Session = Depends(get_db),
        token_payload: TokenPayload = Depends(get_current_token_payload)
    ) -> TokenPayload:
        
        user_uuid = uuid.UUID(token_payload.sub)

        stmt = (
            select(LabMembership)
            .join(User, User.id == LabMembership.user_id)
            .join(Lab, Lab.id == LabMembership.lab_id)
            .where(
                User.id == user_uuid,
                User.is_active == True,
                LabMembership.user_id == user_uuid,
                Lab.id == User.default_lab_id,
                Lab.is_active == True 
            )
        )
        membership = db.execute(stmt).scalars().first()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Access Denied: Your workspace or membership has been suspended or deleted."
            )
        
        user_permissions = membership.permissions or []
        is_owner = "owner" in user_permissions
            
        if membership.status != MembershipStatus.ACTIVE and not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Membership status: {membership.status.name}."
            )

        if not is_owner and required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: '{required_permission}'."
            )

        return token_payload

    return permission_checker


# ==========================================
# SUPER ADMIN AUTHORIZATION
# ==========================================
def require_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """🛡️ GLOBAL SECURITY BOUNCER: Enforces Super Admin privileges."""
    if not getattr(current_user, 'is_superadmin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Requires Global Super Admin privileges."
        )
    return current_user


def require_admin_cookie(
    request: Request, 
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """🛡️ HTTP-ONLY COOKIE BOUNCER: Validates JWT session from encrypted cookies for SSR template routes."""
    token = request.cookies.get("platform_admin_session")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_303_SEE_OTHER,
            headers={"Location": "/admin/login"}
        )
    
    try:
        payload = decode_access_token(token)
        if not payload.get("is_superadmin"):
            raise HTTPException(status_code=status.HTTP_303_SEE_OTHER, headers={"Location": "/admin/login"})
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_303_SEE_OTHER, headers={"Location": "/admin/login"})


async def verify_lab_access(
    x_lab_id: str = Header(None), 
    db: Session = Depends(get_db)
):
    if not x_lab_id:
        raise HTTPException(status_code=403, detail="Lab context missing.")

    lab = db.query(Lab).filter(Lab.id == x_lab_id).first()
    
    if not lab:
        # 🚀 Must include the word "Lab" or "Workspace"
        raise HTTPException(status_code=404, detail="Lab not found or has been deleted.")
        
    return lab


# import uuid
# import logging
# from typing import Callable, Dict, Any
# from fastapi import Depends, HTTPException, status, Request, Header
# from fastapi.security import OAuth2PasswordBearer
# from sqlalchemy import select
# from sqlalchemy.orm import Session
# from pydantic import ValidationError

# from ..core.config import settings
# from ..core.database import get_db
# from ..core.security import decode_access_token
# from ..schemas.auth import TokenPayload
# from ..models.user import User
# from ..models.lab import Lab
# from ..models.labmembership import LabMembership, MembershipStatus

# # logger = logging.getLogger(__name__)

# # ==========================================
# # OPENAPI / SWAGGER UI CONFIGURATION
# # ==========================================
# oauth2_scheme = OAuth2PasswordBearer(
#     tokenUrl="/api/v1/auth/swagger-login", 
#     scheme_name="JWT"
# )


# # ==========================================
# # CORE AUTHENTICATION DEPENDENCY
# # ==========================================
# def get_current_token_payload(token: str = Depends(oauth2_scheme)) -> TokenPayload:
#     """
#     Validates the Bearer JWT and converts it into a typed TokenPayload object.
#     """
#     raw_payload = decode_access_token(token)
    
#     try:
#         return TokenPayload(**raw_payload)
#     except ValidationError as e:
#         # logger.error(f"Malformed Token Payload: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid security token structure.",
#             headers={"WWW-Authenticate": "Bearer"},
#         )


# # ==========================================
# # ACTIVE USER VERIFICATION (Anti-Zombie Token)
# # ==========================================
# def get_current_user(
#     db: Session = Depends(get_db),
#     token_payload: TokenPayload = Depends(get_current_token_payload)
# ) -> User:
#     """
#     Verifies that the user identified in the JWT physically exists 
#     and is active in the database (< 1ms PK Lookup).
#     """
#     try:
#         user_uuid = uuid.UUID(token_payload.sub)
#     except ValueError:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED, 
#             detail="Invalid token subject format."
#         )
    
#     stmt = select(User).where(
#         User.id == user_uuid,
#         User.is_active == True,
#         User.is_verified == True
#     )
#     user = db.execute(stmt).scalars().first()
    
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="User account does not exist or has been deactivated."
#         )
#     return user


# def get_current_active_user(
#     current_user: User = Depends(get_current_user)
# ) -> User:
#     """
#     Ensures the user hasn't been deactivated mid-session.
#     """
#     if not current_user.is_active:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Account deactivated."
#         )
#     return current_user


# # ==========================================
# # TENANT-SCOPED RBAC DEPENDENCY FACTORY
# # ==========================================
# def require_lab_permission(required_permission: str) -> Callable:
#     """
#     Dependency Factory: Validates contextual permissions for the user's default lab.
#     """
#     def permission_checker(
#         db: Session = Depends(get_db),
#         token_payload: TokenPayload = Depends(get_current_token_payload)
#     ) -> TokenPayload:
        
#         try:
#             user_uuid = uuid.UUID(token_payload.sub)
#         except ValueError:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid UUID.")

#         # 1. Fetch user's active context and lab membership in 1 query
#         stmt = (
#             select(LabMembership)
#             .join(User, User.default_lab_id == LabMembership.lab_id)
#             .where(
#                 User.id == user_uuid,
#                 User.is_active == True,
#                 LabMembership.user_id == user_uuid
#             )
#         )
#         membership = db.execute(stmt).scalars().first()

#         # 2. Zero-Trust Access Checks
#         if not membership:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Active workspace membership not found."
#             )
        
#         user_permissions = membership.permissions or []
#         is_owner = "owner" in user_permissions
            
#         # 3. Status Check (Suspended/Pending accounts blocked unless owner)
#         if membership.status != MembershipStatus.ACTIVE and not is_owner:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail=f"Access denied. Membership status: {membership.status.value if hasattr(membership.status, 'value') else membership.status}."
#             )

#         # 4. Permission Verification
#         if not is_owner and required_permission not in user_permissions:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail=f"Missing required permission: '{required_permission}'."
#             )

#         return token_payload

#     return permission_checker


# # ==========================================
# # SUPER ADMIN AUTHORIZATION
# # ==========================================
# def require_super_admin(
#     current_user: User = Depends(get_current_user)
# ) -> User:
#     """
#     🛡️ GLOBAL SECURITY BOUNCER: Enforces Super Admin privileges.
#     """
#     if not getattr(current_user, 'is_superadmin', False):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Access Denied: Requires Global Super Admin privileges."
#         )
#     return current_user


# def require_admin_cookie(
#     request: Request, 
#     db: Session = Depends(get_db)
# ) -> Dict[str, Any]:
#     """
#     🛡️ HTTP-ONLY COOKIE BOUNCER: 
#     Validates JWT session from encrypted cookies for SSR template routes.
#     """
#     token = request.cookies.get("platform_admin_session")
    
#     if not token:
#         raise HTTPException(
#             status_code=status.HTTP_303_SEE_OTHER,
#             headers={"Location": "/admin/login"}
#         )
    
#     try:
#         payload = decode_access_token(token)
#         if not payload.get("is_superadmin"):
#             raise HTTPException(
#                 status_code=status.HTTP_303_SEE_OTHER, 
#                 headers={"Location": "/admin/login"}
#             )
#         return payload
#     except Exception:
#         raise HTTPException(
#             status_code=status.HTTP_303_SEE_OTHER, 
#             headers={"Location": "/admin/login"}
#         )
    

# async def verify_lab_access(
#     x_lab_id: str = Header(None), 
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     if not x_lab_id:
#         raise HTTPException(status_code=403, detail="Lab context missing.")

#     # Check if the lab actually exists in the DB
#     lab = db.query(Lab).filter(Lab.name == x_lab_id).first()
    
#     if not lab:
#         # SCENARIO: Lab was deleted!
#         raise HTTPException(status_code=403, detail="Lab no longer exists.")
        
#     # Check if user has access to it
#     has_access = db.query(LabMembership).filter(
#         LabMembership.user_id == current_user.id, 
#         LabMembership.lab_id == lab.id
#     ).first()
    
#     if not has_access:
#         # SCENARIO: User's access to this lab was revoked!
#         raise HTTPException(status_code=403, detail="Access revoked for this Labspace.")

#     return lab

# # from urllib.request import Request

# # import jwt
# # import uuid
# # from typing import Callable
# # from fastapi import Depends, HTTPException, status, Path
# # from fastapi.security import OAuth2PasswordBearer
# # from sqlalchemy import select
# # from sqlalchemy.orm import Session
# # from pydantic import ValidationError

# # # Adjust imports to match your project structure
# # from ..core.config import settings
# # from ..core.security import decode_access_token
# # from ..core.database import get_db
# # from ..schemas.auth import TokenPayload
# # from ..models.user import User
# # from ..models.labmembership import LabMembership, MembershipStatus

# # # ==========================================
# # # OPENAPI / SWAGGER UI CONFIGURATION
# # # ==========================================
# # oauth2_scheme = OAuth2PasswordBearer(
# #     tokenUrl="/api/v1/auth/login", 
# #     scheme_name="JWT"
# # )

# # # ==========================================
# # # CORE AUTHENTICATION DEPENDENCY
# # # ==========================================
# # def get_current_token_payload(token: str = Depends(oauth2_scheme)) -> TokenPayload:
# #     """
# #     Validates the JWT and returns the parsed TokenPayload schema.
# #     Guarantees the user is logged in, but does NOT check lab-specific permissions.
# #     """
# #     credentials_exception = HTTPException(
# #         status_code=status.HTTP_401_UNAUTHORIZED,
# #         detail="Could not validate credentials",
# #         headers={"WWW-Authenticate": "Bearer"},
# #     )
    
# #     try:
# #         # Decode the token (automatically verifies expiration via the 'exp' claim)
# #         payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
# #         # Load the raw dictionary into our strict Pydantic V2 schema
# #         token_data = TokenPayload(**payload)
        
# #     except jwt.ExpiredSignatureError:
# #         raise HTTPException(
# #             status_code=status.HTTP_401_UNAUTHORIZED,
# #             detail="Session expired. Please log in again.",
# #             headers={"WWW-Authenticate": "Bearer"},
# #         )
# #     except ValidationError as e:
# #         print(f"\n🚨 PYDANTIC ERROR: {e}\n") 
# #         raise credentials_exception
# #     except jwt.PyJWTError as e:
# #         print(f"\n🚨 JWT ERROR: {e}\n") 
# #         raise credentials_exception
        
# #     return token_data


# # # ==========================================
# # # ACTIVE USER VERIFICATION (Instant Revocation)
# # # ==========================================
# # def get_current_user(
# #     db: Session = Depends(get_db),
# #     token_payload: TokenPayload = Depends(get_current_token_payload)
# # ) -> User:
# #     """
# #     Takes the mathematically valid JWT, extracts the subject (UUID), 
# #     and physically verifies the user still exists in the database.
# #     """
# #     try:
# #         user_uuid = uuid.UUID(token_payload.sub)
# #     except ValueError:
# #         raise HTTPException(status_code=401, detail="Invalid token subject format.")
    
# #     # ⚡ FAST QUERY: Primary Key lookup (< 1ms)
# #     user = db.execute(select(User).where(
# #         User.id == user_uuid,
# #         User.is_active == True,
# #         User.is_verified == True
# #         )).scalars().first()
    
# #     if not user:
# #         raise HTTPException(
# #             status_code=status.HTTP_401_UNAUTHORIZED,
# #             detail="The user no longer exists or has been deactivated."
# #         )
# #     return user


# # def get_current_active_user(
# #     current_user: User = Depends(get_current_user)
# # ) -> User:
# #     """
# #     Ensures the user hasn't been deactivated by an admin.
# #     Use this on EVERY generic route to prevent Zombie Tokens.
# #     """
# #     if getattr(current_user, 'is_active', True) is False:
# #         raise HTTPException(
# #             status_code=status.HTTP_403_FORBIDDEN,
# #             detail="Your account has been deactivated. Access revoked."
# #         )
# #     return current_user


# # # ==========================================
# # # TENANT-SCOPED RBAC DEPENDENCY FACTORY
# # # ==========================================
# # def require_lab_permission(required_permission: str) -> Callable:
# #     """
# #     Dependency Factory: Returns a dependency function that checks if the 
# #     authenticated user has the required permission within a specific lab.
# #     """
# #     def permission_checker(
# #         # FastAPI natively extracts and validates the UUID from the URL path!
# #         # lab_id: uuid.UUID = Path(..., description="The UUID of the laboratory"),
# #         # lab_id: str = Path(..., description="The UUID of the laboratory"),
# #         db: Session = Depends(get_db),
# #         token_payload: TokenPayload = Depends(get_current_token_payload)
# #     ) -> TokenPayload:
        
# #         user_uuid = uuid.UUID(token_payload.sub)

# #         # ⚡ FAST QUERY: Look up the exact membership record in PostgreSQL
# #         stmt = (select(LabMembership)
# #         .join(User, User.default_lab_id == LabMembership.lab_id)
# #         .where(
# #             User.id == user_uuid,
# #             User.is_active == True,
# #             User.is_verified == True,
# #             LabMembership.user_id == user_uuid,
# #             LabMembership.status == "ACTIVE",
# #         ))
# #         membership = db.execute(stmt).scalars().first()

# #         # 🛡️ SECURITY CHECKS (Zero-Trust Architecture)
# #         if not membership:
# #             raise HTTPException(
# #                 # status_code=status.HTTP_403_FORBIDDEN,
# #                 # detail="You are not a member of this laboratory."
# #                 status_code=status.HTTP_404_FORBIDDEN,
# #                 detail="404, Not found"
# #             )
        
# #         # Extract permissions once for efficiency
# #         user_permissions = membership.permissions or []
# #         is_owner = "owner" in user_permissions
            
# #         # 🔓 THE OWNER OVERRIDE: 
# #         # Only block access if the user is NOT an owner AND the membership is NOT active.
# #         if membership.status != MembershipStatus.ACTIVE:
# #             if not is_owner:
# #                 raise HTTPException(
# #                     status_code=status.HTTP_403_FORBIDDEN,
# #                     detail=f"Access denied. Your membership status is {membership.status.value}."
# #                 )

# #         # 🔑 PERMISSION VERIFICATION
# #         if not is_owner and required_permission not in user_permissions:
# #             raise HTTPException(
# #                 status_code=status.HTTP_403_FORBIDDEN,
# #                 detail=f"You lack the required permission ('{required_permission}') to perform this action."
# #             )

# #         # Return the payload so the router can use the user's ID
# #         return token_payload

# #     return permission_checker


# # def require_super_admin(
# #     current_user: User = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ) -> User:
# #     """
# #     🛡️ GLOBAL SECURITY BOUNCER: 
# #     Checks if the authenticated user has global Super Admin privileges.
# #     """
# #     # Assuming your User model has an `is_superadmin` boolean 
# #     # OR you can check `current_user.role == "SUPER_ADMIN"`
# #     if not getattr(current_user, 'is_superadmin', False):
# #         # Return 403 Forbidden (or 404 to completely hide the endpoint's existence)
# #         raise HTTPException(
# #             status_code=status.HTTP_403_FORBIDDEN,
# #             detail="Access Denied: Requires Global Super Admin privileges."
# #         )
# #     return current_user

 

# # def require_admin_cookie(request: Request, db: Session = Depends(get_db)):
# #     """
# #     🛡️ HTTP-ONLY COOKIE BOUNCER: 
# #     Reads the JWT from a secure cookie. If missing or invalid, redirects to login.
# #     """
# #     token = request.cookies.get("super_admin_session")
    
# #     if not token:
# #         # Redirects unauthorized browsers to the login page
# #         raise HTTPException(
# #             status_code=status.HTTP_303_SEE_OTHER,
# #             headers={"Location": "/admin/login"}
# #         )
    
# #     try:
# #         # Validate your token here
# #         payload = decode_access_token(token)
# #         # Check if user is actually a super admin
# #         if not payload.get("is_superadmin"):
# #             raise HTTPException(status_code=status.HTTP_303_SEE_OTHER, headers={"Location": "/admin/login"})
# #         return payload
# #     except Exception:
# #         raise HTTPException(status_code=status.HTTP_303_SEE_OTHER, headers={"Location": "/admin/login"})