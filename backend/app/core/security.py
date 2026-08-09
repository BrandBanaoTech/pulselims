import bcrypt
import hashlib
import jwt
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from fastapi import HTTPException, status

from ..core.config import settings

logger = logging.getLogger(__name__)

# ==========================================
# 1. PASSWORD MANAGEMENT (NIST SP 800-63B Compliant)
# ==========================================
def get_password_hash(password: str) -> str:
    """
    Hashes a password using Bcrypt with a work factor of 12.
    Applies a SHA-256 pre-hash to safely eliminate Bcrypt's 72-byte truncation 
    limit without introducing null-byte vulnerability vectors.
    """
    pre_hashed = hashlib.sha256(password.encode('utf-8')).hexdigest().encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pre_hashed, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against a stored Bcrypt hash using constant-time comparison.
    """
    try:
        pre_hashed = hashlib.sha256(plain_password.encode('utf-8')).hexdigest().encode('utf-8')
        return bcrypt.checkpw(pre_hashed, hashed_password.encode('utf-8'))
    except (ValueError, TypeError) as e:
        logger.error(f"Password verification error: {e}")
        return False


# ==========================================
# 2. STATELESS JWT ENGINE (PyJWT Standardized)
# ==========================================
def create_access_token(
    subject: Union[str, Any], 
    email: str, 
    mobile: str, 
    is_superadmin: bool = False,
    lab_permissions: Optional[Dict[str, list]] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Generates a cryptographically signed JWT access token.
    """
    if lab_permissions is None:
        lab_permissions = {}
        
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "iat": now,
        "nbf": now,
        "sub": str(subject),
        "email": email,
        "mobile": mobile,
        "is_superadmin": is_superadmin,
        "lab_permissions": lab_permissions,
        "type": "access"
    }
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token.
    Enforces expiration (exp), activation time (nbf), and cryptographic signature.
    """
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": True, "verify_nbf": True}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        logger.warning(f"Invalid JWT attempt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# import bcrypt
# import hashlib
# from jose import jwt
# from datetime import datetime, timedelta, timezone
# from typing import Any, Dict, Union
# from app.core.config import settings


# # PASSWORD MANAGEMENT (NIST Compliant)
# def get_password_hash(password: str) -> str:
#     """
#     Hashes a password using bcrypt.
#     Includes a SHA-256 pre-hash to safely bypass bcrypt's 72-byte limit
#     while maintaining maximum entropy.
#     """
#     # 1. Pre-hash to standard 64-character hex string
#     pre_hashed = hashlib.sha256(password.encode('utf-8')).hexdigest().encode('utf-8')
    
#     # 2. Hash with bcrypt using a work factor of 12 (Modern standard)
#     salt = bcrypt.gensalt(rounds=12)
#     hashed = bcrypt.hashpw(pre_hashed, salt)
    
#     return hashed.decode('utf-8')


# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     """
#     Verifies a plain password against the stored hash.
#     Uses bcrypt.checkpw to ensure constant-time comparison, preventing timing attacks.
#     """
#     try:
#         pre_hashed = hashlib.sha256(plain_password.encode('utf-8')).hexdigest().encode('utf-8')
#         return bcrypt.checkpw(pre_hashed, hashed_password.encode('utf-8'))
#     except ValueError:
#         # Catches badly formatted hashes gracefully
#         return False


# # JWT (STATELESS AUTHORIZATION)
# def create_access_token(subject: Union[str, Any], email: str, mobile: str, lab_permissions: Dict[str, list] = None) -> str:
#     """
#     Generates a stateless JWT containing user identity and tenant-scoped permissions.
#     """
#     if lab_permissions is None:
#         lab_permissions = {}
        
#     # Use timezone-aware UTC datetime for expiration
#     expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
#     # Matches the TokenPayload schema we built earlier
#     to_encode = {
#         "exp": expire,
#         "sub": str(subject),
#         "email": email,
#         "mobile": mobile,
#         "lab_permissions": lab_permissions
#     }
    
#     encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
#     return encoded_jwt