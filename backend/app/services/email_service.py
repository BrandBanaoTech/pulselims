import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from ..core.config import settings

# 🛡️ COMPLIANCE: Configure secure logger
logger = logging.getLogger(__name__)

# ==========================================
# 1. ENTERPRISE SMTP CONFIGURATION
# ==========================================
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,     # 🔒 Enforces Bank-Grade TLS 1.2/1.3 Encryption
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,   # Prevents Man-in-the-Middle (MITM) attacks
    TIMEOUT=10             # Prevents SMTP server lag from hanging your API background workers
)

fast_mail = FastMail(conf)


# ==========================================
# 2. THE SENDER FUNCTIONS (Fully Async)
# ==========================================
async def send_registration_otp(target_email: EmailStr, otp_code: str):
    """
    Asynchronously dispatches the OTP email.
    Uses non-blocking I/O for maximum FastAPI scalability.
    """
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0;">
    
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- ================= HEADER (LOGO & BRAND) ================= -->
        <div style="text-align: center; padding: 32px 20px 24px; border-bottom: 1px solid #f1f5f9;">
            <!-- Replace the src with your actual logo URL -->
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwZjc2NmUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1oZWFydC1wdWxzZS1pY29uIGx1Y2lkZS1oZWFydC1wdWxzZSI+PHBhdGggZD0iTTIgOS41YTUuNSA1LjUgMCAwIDEgOS41OTEtMy42NzYuNTYuNTYgMCAwIDAgLjgxOCAwQTUuNDkgNS40OSAwIDAgMSAyMiA5LjVjMCAyLjI5LTEuNSA0LTMgNS41bC01LjQ5MiA1LjMxM2EyIDIgMCAwIDEtMyAuMDE5TDUgMTVjLTEuNS0xLjUtMy0zLjItMy01LjUiLz48cGF0aCBkPSJNMy4yMiAxM0g5LjVsLjUtMSAyIDQuNSAyLTcgMS41IDMuNWg1LjI3Ii8+PC9zdmc+" alt="Company Logo" style="width: 56px; height: 56px; vertical-align: middle; margin-bottom: 12px;" />
            <h1 style="margin: 0; font-size: 22px; color: #0f766e; font-weight: 700; letter-spacing: -0.5px;">PulseLIMS</h1>
        </div>

        <!-- ================= MAIN CONTENT ================= -->
        <div style="padding: 40px 32px;">
            <h2 style="margin: 0 0 24px; color: #0f172a; font-size: 20px; font-weight: 600;">Secure Verification Code</h2>
            
            <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">Hello,</p>
            <p style="margin: 0 0 32px; color: #475569; font-size: 16px; line-height: 1.6;">You are almost ready to access your laboratory workspace. Please use the secure verification code below to confirm your identity and complete your registration.</p>
            
            <!-- OTP BOX -->
            <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 700; letter-spacing: 12px; color: #0f766e; display: block; margin-left: 12px;">{otp_code}</span>
            </div>
            
            <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; line-height: 1.5;">
                <strong style="color: #475569;">Security Notice:</strong> This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone, including our support team.
            </p>
        </div>

        <!-- ================= FOOTER ================= -->
        <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 12px; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                If you did not request this email, please ignore it or <a href="#" style="color: #0f766e; text-decoration: underline;">contact our security team</a>.
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                &copy; 2026 PulseLIIMS. All rights reserved.
            </p>
        </div>
        
    </div>

</body>
</html>
"""

    message = MessageSchema(
        subject=f"{otp_code} is your Lab verification code",
        recipients=[target_email],
        body=html_content,
        subtype=MessageType.html
    )

    try:
        await fast_mail.send_message(message)
        # 🛡️ COMPLIANCE: Mask email in logs (e.g., d***r@gmail.com). NEVER log the OTP.
        masked_email = f"{target_email[0]}***{target_email[target_email.index('@') - 1:]}"
        logger.info(f"✅ Secure OTP dispatched to {masked_email}")
    except Exception as e:
        logger.error(f"❌ SMTP Failure for {masked_email}. Cause: {str(e)[:50]}")


async def send_security_alert(target_email: EmailStr):
    """
    Sends a security alert if the account already exists.
    Prevents User Enumeration attacks.
    """
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0;">
        
        <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; border-top: 5px solid #dc2626; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <!-- ================= HEADER (LOGO & BRAND) ================= -->
            <div style="padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9; text-align: left;">
                <span style="font-size: 20px; color: #0f172a; font-weight: 700; vertical-align: middle; letter-spacing: -0.5px;">PulseLIMS</span>
            </div>

            <!-- ================= MAIN CONTENT ================= -->
            <div style="padding: 32px;">
                <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 22px; font-weight: 700;">Security Alert: New Sign-in Detected</h2>
                
                <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                    We noticed a new sign-in to your master administrative account from a device or location we don't recognize. 
                </p>
                
                <!-- SECURITY DETAILS BLOCK -->
                
                <!-- CALL TO ACTION (CTA) -->
                <h3 style="margin: 0 0 12px; font-size: 16px; color: #0f172a; font-weight: 600;">Was this you?</h3>
                <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                    If you recognize this activity, you can safely ignore this email. If this wasn't you, your account may be compromised. Please secure your account immediately.
                </p>
            </div>

            <!-- ================= FOOTER ================= -->
            <div style="background-color: #f8fafc; padding: 24px 32px; text-align: left; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; line-height: 1.5;">
                    Security Tip: We will never ask for your password via email.
                </p>
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                    This is an automated security alert generated by YourLab LIMS. <br>
                    &copy; 2026  PulseLIMS. All rights reserved.
                </p>
            </div>
            
        </div>

    </body>
    </html>
    """
    
    message = MessageSchema(
        subject="Security Alert: Registration Attempted",
        recipients=[target_email],
        body=html_content,
        subtype=MessageType.html
    )

    try:
        await fast_mail.send_message(message)
        masked_email = f"{target_email[0]}***{target_email[target_email.index('@') - 1:]}"
        logger.warning(f"⚠️ Security Alert dispatched to {masked_email}")
    except Exception as e:
        logger.error(f"❌ Failed to send security alert: {str(e)[:50]}")