import pyotp
import qrcode
import io
import base64
import secrets
import hashlib
import json
import logging
from typing import Tuple, List

logger = logging.getLogger(__name__)

class TOTPService:
    ISSUER_NAME = "PulseLIMS"

    @staticmethod
    def generate_secret() -> str:
        """Generates a secure 32-character Base32 secret."""
        return pyotp.random_base32()

    @staticmethod
    def generate_qr_base64(email: str, secret: str) -> str:
        """
        Generates the provisioning URI and converts the QR code to a Base64 string.
        Frontend usage: <img src="data:image/png;base64,{qr_base64}" />
        """
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(name=email, issuer_name=TOTPService.ISSUER_NAME)
        
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        return qr_base64

    @staticmethod
    def verify_code(secret: str, code: str) -> bool:
        """
        Verifies the code with a valid_window=1.
        This accepts codes from the previous, current, and next 30-second windows 
        to account for network latency and slow typing.
        """
        if not secret or not code or len(code) != 6:
            return False
            
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)

    @staticmethod
    def generate_backup_codes(count: int = 10) -> List[str]:
        """Generates cryptographically secure 8-character alphanumeric backup codes."""
        return ["".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(8)) for _ in range(count)]

    @staticmethod
    def hash_backup_code(code: str) -> str:
        """
        Hashes a backup code using SHA-256 for secure database storage.
        Strips whitespace and converts to uppercase for user convenience.
        """
        clean_code = code.strip().upper().replace("-", "")
        return hashlib.sha256(clean_code.encode("utf-8")).hexdigest()

    @staticmethod
    def process_backup_codes(raw_codes: List[str]) -> Tuple[List[str], str]:
        """
        Returns plain-text codes (for user display) and a JSON string of SHA-256 hashes (for DB storage).
        """
        hashed_codes = [TOTPService.hash_backup_code(c) for c in raw_codes]
        return raw_codes, json.dumps(hashed_codes)

    @staticmethod
    def verify_and_consume_backup_code(stored_hashes_json: str, submitted_code: str) -> Tuple[bool, str, int]:
        """
        Verifies if the submitted backup code exists.
        If valid, removes the hash from the list and returns:
        (is_valid, updated_hashes_json, remaining_count)
        """
        if not stored_hashes_json:
            return False, "", 0

        try:
            hashes = json.loads(stored_hashes_json)
        except json.JSONDecodeError:
            return False, "", 0

        submitted_hash = TOTPService.hash_backup_code(submitted_code)

        if submitted_hash in hashes:
            # 🔒 SINGLE-USE CONSUMPTION: Remove the used hash
            hashes.remove(submitted_hash)
            updated_json = json.dumps(hashes)
            return True, updated_json, len(hashes)

        return False, stored_hashes_json, len(hashes)