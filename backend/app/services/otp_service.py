import hashlib
import hmac
import jwt
import secrets
import string
from datetime import datetime, timedelta, timezone
from ..core.config import settings

# ---------------------------------------------------------
# CONFIGURATION (Store in .env in production)
# ---------------------------------------------------------
OTP_SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
OTP_EXPIRY_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def generate_stateless_otp(target: str) -> tuple[str, str]:
    """
    Generates a 6-digit OTP and a cryptographic verification token.
    Returns: (plain_otp, verification_token)
    """
    # 1. Generate the random 6-digit OTP
    plain_otp = ''.join(secrets.choice(string.digits) for _ in range(6))
    
    # 2. Hash the OTP using SHA-256. 
    # We salt it with the Secret Key so hackers can't reverse-engineer it using rainbow tables.
    otp_hash = hashlib.sha256((plain_otp + OTP_SECRET_KEY).encode('utf-8')).hexdigest()
    
    # 3. Create a short-lived payload
    expire = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    payload = {
        "sub": target.lower(), # The phone number or email
        "otp_hash": otp_hash,  # The mathematical proof of the OTP
        "exp": expire
    }
    
    # 4. Sign the payload into a JWT Verification Token
    verification_token = jwt.encode(payload, OTP_SECRET_KEY, algorithm=ALGORITHM)
    
    return plain_otp, verification_token


def verify_stateless_otp(target: str, plain_otp: str, verification_token: str) -> bool:
    """
    Verifies the user's OTP entirely mathematically. Zero database lookups.
    """
    try:
        # 1. Decode token (PyJWT automatically throws an error if it's expired or tampered with)
        payload = jwt.decode(verification_token, OTP_SECRET_KEY, algorithms=[ALGORITHM])
        
        # 2. Verify target matches (Prevents a hacker from using a Mobile Token to verify an Email)
        if payload.get("sub") != target.lower():
            return False
            
        # 3. Re-hash the OTP that the user typed in
        expected_hash = hashlib.sha256((plain_otp + OTP_SECRET_KEY).encode('utf-8')).hexdigest()
        
        # 4. Securely compare the hashes (hmac.compare_digest prevents timing attacks)
        return hmac.compare_digest(expected_hash, payload.get("otp_hash", ""))
        
    except jwt.ExpiredSignatureError:
        return False # Token lived past 10 minutes
    except jwt.PyJWTError:
        return False # Token was mangled or signatures didn't match