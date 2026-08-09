import os
import httpx
import logging
from dotenv import dotenv_values
from pydantic import EmailStr

config = dotenv_values(".env")

# 🛡️ COMPLIANCE: Secure audit logger
logger = logging.getLogger(__name__)

# Standard 12-Factor App environment variable loading
GAS_WEBHOOK_URL = config.get("GOOGLE_MAIL_WEBHOOK")
GAS_API_TOKEN = config.get("GOOGLE_MAIL_TOKEN")

# ==========================================
# HELPER: COMPLIANT DATA MASKING
# ==========================================
def mask_email(email: str) -> str:
    """Safely masks an email for SOC2 compliant logging."""
    try:
        username, domain = str(email).split('@')
        if len(username) <= 2:
            return f"{username[0]}***@{domain}"
        return f"{username[0]}***{username[-1]}@{domain}"
    except ValueError:
        return "***@***.***"


# ==========================================
# 1. THE OTP TEMPLATE & SENDER
# ==========================================
async def send_registration_otp(target_email: EmailStr, otp_code: str):
    """
    Asynchronously dispatches the OTP email via Google Serverless Webhook.
    """
    # if not GAS_WEBHOOK_URL or not GAS_API_TOKEN:
    #     logger.error("Missing Google Webhook configuration in environment variables.")
    #     return

    # 🎨 MARKET-READY TEMPLATE: Clean, responsive, high-contrast OTP email
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; -webkit-font-smoothing: antialiased;">
        
        <div style="background-color: #ffffff; max-width: 500px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <!-- HEADER -->
            <div style="text-align: center; padding: 32px 20px 24px; border-bottom: 1px solid #f1f5f9;">
                <h1 style="margin: 0; font-size: 24px; color: #0f766e; font-weight: 800; letter-spacing: -0.5px;">PulseLIMS</h1>
            </div>

            <!-- MAIN CONTENT -->
            <div style="padding: 32px;">
                <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">Verify your email address</h2>
                <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                    You are almost ready to access your laboratory workspace. Please enter the verification code below to complete your registration.
                </p>
                
                <!-- OTP BOX -->
                <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #0f766e; display: block; margin-left: 12px;">{otp_code}</span>
                </div>
                
                <p style="margin: 0 0 12px; color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
                    This code is valid for <strong>10 minutes</strong>.<br>Do not share this code with anyone.
                </p>
            </div>

            <!-- FOOTER -->
            <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                    If you did not request this email, you can safely ignore it.
                </p>
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                    &copy; 2026 PulseLIMS. All rights reserved.
                </p>
            </div>
            
        </div>
    </body>
    </html>
    """

    payload = {
        "api_token": GAS_API_TOKEN,
        "to": target_email,
        "subject": f"{otp_code} is your PulseLIMS verification code",
        "html_content": html_content
    }

    masked = mask_email(target_email)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{GAS_WEBHOOK_URL}",
                json=payload,
                timeout=15.0,
                follow_redirects=True 
            )
            
            # 🛡️ SAFETY: Google sometimes returns HTML error pages if the script crashes
            try:
                response_data = response.json()
            except ValueError:
                logger.error("Google Webhook returned non-JSON response. Target: %s", masked)
                return

            if response_data.get("success"):
                logger.info("Secure OTP dispatched successfully via Google Webhook", extra={"target": masked})
            else:
                logger.error("Google Webhook rejected the request: %s", response_data.get("error"))
                
    except Exception:
        logger.error("HTTP API Failure during OTP dispatch for %s", masked, exc_info=True)


# ==========================================
# 2. THE SECURITY ALERT TEMPLATE & SENDER
# ==========================================
async def send_security_alert(target_email: EmailStr):
    """
    Sends a security alert via Google Serverless Webhook.
    """
    if not GAS_WEBHOOK_URL or not GAS_API_TOKEN:
        return

    # 🎨 MARKET-READY TEMPLATE: Urgent, red-themed security notice
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; -webkit-font-smoothing: antialiased;">
        
        <div style="background-color: #ffffff; max-width: 500px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; border-top: 5px solid #dc2626; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <!-- HEADER -->
            <div style="padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9; text-align: left;">
                <span style="font-size: 22px; color: #0f172a; font-weight: 800; letter-spacing: -0.5px;">PulseLIMS</span>
            </div>

            <!-- MAIN CONTENT -->
            <div style="padding: 32px;">
                <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">Security Alert: Registration Attempt</h2>
                
                <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                    Someone recently attempted to register a new PulseLIMS account using this email address. Because this email is already registered to an active account, we blocked the registration attempt to protect your data. 
                </p>
                
                <h3 style="margin: 0 0 8px; font-size: 15px; color: #0f172a; font-weight: 600;">Was this you?</h3>
                <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.6;">
                    If you were simply trying to log in and accidentally went to the registration page, you can safely ignore this email. If this wasn't you, your account remains secure, but you may want to update your password.
                </p>
            </div>

            <!-- FOOTER -->
            <div style="background-color: #f8fafc; padding: 24px 32px; text-align: left; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; line-height: 1.5;">
                    Security Tip: We will never ask for your password or OTP via email.
                </p>
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                    This is an automated security alert generated by PulseLIMS.<br>
                    &copy; 2026 PulseLIMS. All rights reserved.
                </p>
            </div>
            
        </div>
    </body>
    </html>
    """
    
    payload = {
        "api_token": GAS_API_TOKEN,
        "to": target_email,
        "subject": "Security Alert: Registration Attempted",
        "html_content": html_content
    }

    masked = mask_email(target_email)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{GAS_WEBHOOK_URL}",
                json=payload,
                timeout=15.0,
                follow_redirects=True
            )
            
            try:
                response_data = response.json()
            except ValueError:
                return

            if response_data.get("success"):
                logger.warning("Security Alert dispatched due to registration conflict", extra={"target": masked})
            
    except Exception:
        logger.error("Failed to send security alert to %s", masked, exc_info=True)

# import httpx
# import logging
# from dotenv import dotenv_values
# from pydantic import EmailStr

# config = dotenv_values(".env")

# # 🛡️ COMPLIANCE: Secure audit logger
# logger = logging.getLogger(__name__)

# # Load credentials from .env
# GAS_WEBHOOK_URL = config.get("GOOGLE_MAIL_WEBHOOK")
# GAS_API_TOKEN = config.get("GOOGLE_MAIL_TOKEN")

# def mask_email(email: str) -> str:
#     """Safely masks an email for SOC2 compliant logging."""
#     try:
#         username, domain = str(email).split('@')
#         if len(username) <= 2:
#             return f"{username[0]}***@{domain}"
#         return f"{username[0]}***{username[-1]}@{domain}"
#     except ValueError:
#         return "***@***.***"


# async def send_registration_otp(target_email: EmailStr, otp_code: str):
#     """
#     Sends email via Google Serverless Webhook (HTTPS Port 443) 
#     completely bypassing Render's SMTP block.
#     """
#     if not GAS_WEBHOOK_URL or not GAS_API_TOKEN:
#         logger.error("Missing Google Webhook configuration in environment variables.")
#         return

#     html_content = f"""
#     <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
#         <h2 style="color: #0f766e; text-align: center;">PulseLIMS</h2>
#         <p>Please use the secure verification code below to complete your registration.</p>
#         <div style="background-color: #f0fdfa; padding: 20px; text-align: center; border-radius: 8px;">
#             <span style="font-size: 38px; font-weight: bold; letter-spacing: 12px; color: #0f766e;">{otp_code}</span>
#         </div>
#         <p style="color: #64748b; font-size: 14px;">Valid for 10 minutes.</p>
#     </div>
#     """

#     payload = {
#         "api_token": GAS_API_TOKEN,
#         "to": target_email,
#         "subject": f"{otp_code} is your PulseLIMS verification code",
#         "html_content": html_content
#     }

#     masked = mask_email(target_email)
    
#     try:
#         # 🚀 Sent asynchronously over HTTPS (Port 443)
#         async with httpx.AsyncClient() as client:
#             # We use follow_redirects=True because Google Scripts natively redirects POST requests once
#             response = await client.post(
#                 GAS_WEBHOOK_URL, 
#                 json=payload, 
#                 timeout=15.0,
#                 follow_redirects=True 
#             )
            
#             response_data = response.json()
            
#             if response_data.get("success"):
#                 logger.info("Secure OTP dispatched successfully via Google Webhook", extra={"target": masked})
#             else:
#                 logger.error("Google Webhook rejected the request: %s", response_data.get("error"))
                
#     except Exception:
#         logger.error("HTTP API Failure during OTP dispatch for %s", masked, exc_info=True)


# async def send_security_alert(target_email: EmailStr):
#     """
#     Sends a security alert via Google Serverless Webhook.
#     """
#     if not GAS_WEBHOOK_URL:
#         return

#     html_content = f"""
#     <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
#         <h2 style="color: #b91c1c;">Security Alert: Registration Attempt</h2>
#         <p>Someone just attempted to register a PulseLIMS account using this email address. Because you already have an account with us, we blocked the registration attempt.</p>
#         <p>If this was you, please return to the login page and sign in.</p>
#     </div>
#     """
    
#     payload = {
#         "api_token": GAS_API_TOKEN,
#         "to": target_email,
#         "subject": "Security Alert: Registration Attempted",
#         "html_content": html_content
#     }

#     masked = mask_email(target_email)
    
#     try:
#         async with httpx.AsyncClient() as client:
#             response = await client.post(
#                 GAS_WEBHOOK_URL, 
#                 json=payload, 
#                 timeout=15.0,
#                 follow_redirects=True
#             )
            
#             if response.json().get("success"):
#                 logger.warning("Security Alert dispatched due to registration conflict", extra={"target": masked})
            
#     except Exception:
#         logger.error("Failed to send security alert to %s", masked, exc_info=True)


# # import logging
# # from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
# # from pydantic import EmailStr
# # from ..core.config import settings

# # # 🛡️ COMPLIANCE: Secure audit logger (Mandatory for SOC2 / HIPAA)
# # logger = logging.getLogger(__name__)

# # # ==========================================
# # # 1. ENTERPRISE SMTP CONFIGURATION
# # # ==========================================
# # conf = ConnectionConfig(
# #     MAIL_USERNAME=settings.MAIL_USERNAME,
# #     MAIL_PASSWORD=settings.MAIL_PASSWORD,
# #     MAIL_FROM=settings.MAIL_FROM,
# #     MAIL_PORT=settings.MAIL_PORT,
# #     MAIL_SERVER=settings.MAIL_SERVER,
# #     MAIL_STARTTLS=False,
# #     MAIL_SSL_TLS=True,     # 🔒 Enforces Bank-Grade TLS 1.2/1.3 Encryption
# #     USE_CREDENTIALS=True,
# #     VALIDATE_CERTS=True,   # Prevents Man-in-the-Middle (MITM) attacks
# #     TIMEOUT=10             # Prevents SMTP server lag from hanging your API background workers
# # )

# # # Singleton instantiation for memory efficiency
# # fast_mail = FastMail(conf)


# # # ==========================================
# # # HELPER: COMPLIANT DATA MASKING
# # # ==========================================
# # def mask_email(email: str) -> str:
# #     """Safely masks an email for SOC2 compliant logging without crashing on short strings."""
# #     try:
# #         username, domain = str(email).split('@')
# #         if len(username) <= 2:
# #             return f"{username[0]}***@{domain}"
# #         return f"{username[0]}***{username[-1]}@{domain}"
# #     except ValueError:
# #         return "***@***.***"


# # # ==========================================
# # # 2. THE SENDER FUNCTIONS (Fully Async)
# # # ==========================================
# # async def send_registration_otp(target_email: EmailStr, otp_code: str):
# #     """
# #     Asynchronously dispatches the OTP email.
# #     Uses non-blocking I/O for maximum FastAPI scalability.
# #     """
# #     html_content = f"""
# # <!DOCTYPE html>
# # <html>
# # <head>
# #     <meta charset="UTF-8">
# #     <meta name="viewport" content="width=device-width, initial-scale=1.0">
# # </head>
# # <body style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0;">
    
# #     <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
# #         <!-- HEADER -->
# #         <div style="text-align: center; padding: 32px 20px 24px; border-bottom: 1px solid #f1f5f9;">
# #             <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwZjc2NmUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1oZWFydC1wdWxzZS1pY29uIGx1Y2lkZS1oZWFydC1wdWxzZSI+PHBhdGggZD0iTTIgOS41YTUuNSA1LjUgMCAwIDEgOS41OTEtMy42NzYuNTYuNTYgMCAwIDAgLjgxOCAwQTUuNDkgNS40OSAwIDAgMSAyMiA5LjVjMCAyLjI5LTEuNSA0LTMgNS41bC01LjQ5MiA1LjMxM2EyIDIgMCAwIDEtMyAuMDE5TDUgMTVjLTEuNS0xLjUtMy0zLjItMy01LjUiLz48cGF0aCBkPSJNMy4yMiAxM0g5LjVsLjUtMSAyIDQuNSAyLTcgMS41IDMuNWg1LjI3Ii8+PC9zdmc+" alt="Company Logo" style="width: 56px; height: 56px; vertical-align: middle; margin-bottom: 12px;" />
# #             <h1 style="margin: 0; font-size: 22px; color: #0f766e; font-weight: 700; letter-spacing: -0.5px;">PulseLIMS</h1>
# #         </div>

# #         <!-- MAIN CONTENT -->
# #         <div style="padding: 40px 32px;">
# #             <h2 style="margin: 0 0 24px; color: #0f172a; font-size: 20px; font-weight: 600;">Secure Verification Code</h2>
# #             <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">Hello,</p>
# #             <p style="margin: 0 0 32px; color: #475569; font-size: 16px; line-height: 1.6;">You are almost ready to access your laboratory workspace. Please use the secure verification code below to confirm your identity and complete your registration.</p>
            
# #             <!-- OTP BOX -->
# #             <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
# #                 <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 700; letter-spacing: 12px; color: #0f766e; display: block; margin-left: 12px;">{otp_code}</span>
# #             </div>
            
# #             <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; line-height: 1.5;">
# #                 <strong style="color: #475569;">Security Notice:</strong> This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone, including our support team.
# #             </p>
# #         </div>

# #         <!-- FOOTER -->
# #         <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
# #             <p style="margin: 0 0 12px; color: #94a3b8; font-size: 12px; line-height: 1.5;">
# #                 If you did not request this email, please ignore it or <a href="#" style="color: #0f766e; text-decoration: underline;">contact our security team</a>.
# #             </p>
# #             <p style="margin: 0; color: #94a3b8; font-size: 12px;">
# #                 &copy; 2026 PulseLIMS. All rights reserved.
# #             </p>
# #         </div>
        
# #     </div>
# # </body>
# # </html>
# # """

# #     message = MessageSchema(
# #         subject=f"{otp_code} is your PulseLIMS verification code",
# #         recipients=[target_email],
# #         body=html_content,
# #         subtype=MessageType.html
# #     )

# #     try:
# #         await fast_mail.send_message(message)
# #         masked_email = mask_email(target_email)
        
# #         # PROD: Clean, parsable string. Extra context passed to JSON renderer.
# #         logger.info(
# #             "Secure OTP dispatched successfully", 
# #             extra={"action": "otp_sent", "target": masked_email}
# #         )
# #     except Exception as e:
# #         masked_email = mask_email(target_email)
        
# #         # PROD: exc_info=True captures the FULL stack trace for your log aggregator.
# #         # F-strings are avoided here so aggregators group the errors under a single hash.
# #         logger.error(
# #             "SMTP Failure during OTP dispatch for %s", 
# #             masked_email, 
# #             extra={"action": "otp_failed", "target": masked_email},
# #             exc_info=True 
# #         )


# # async def send_security_alert(target_email: EmailStr):
# #     """
# #     Sends a security alert if the account already exists.
# #     Prevents User Enumeration attacks.
# #     """
# #     html_content = f"""
# #     <!DOCTYPE html>
# #     <html>
# #     <head>
# #         <meta charset="UTF-8">
# #         <meta name="viewport" content="width=device-width, initial-scale=1.0">
# #     </head>
# #     <body style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0;">
        
# #         <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; border-top: 5px solid #dc2626; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
# #             <!-- HEADER -->
# #             <div style="padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9; text-align: left;">
# #                 <span style="font-size: 20px; color: #0f172a; font-weight: 700; vertical-align: middle; letter-spacing: -0.5px;">PulseLIMS</span>
# #             </div>

# #             <!-- MAIN CONTENT -->
# #             <div style="padding: 32px;">
# #                 <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 22px; font-weight: 700;">Security Alert: Registration Attempt</h2>
                
# #                 <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
# #                     Someone recently attempted to register a new PulseLIMS account using this email address. Because this email is already registered to an active account, we blocked the registration attempt to protect your data. 
# #                 </p>
                
# #                 <h3 style="margin: 0 0 12px; font-size: 16px; color: #0f172a; font-weight: 600;">Was this you?</h3>
# #                 <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
# #                     If you were simply trying to log in and accidentally went to the registration page, you can safely ignore this email and return to the sign-in page. If this wasn't you, your account remains secure, but you may want to update your password if you feel it has been compromised.
# #                 </p>
# #             </div>

# #             <!-- FOOTER -->
# #             <div style="background-color: #f8fafc; padding: 24px 32px; text-align: left; border-top: 1px solid #e2e8f0;">
# #                 <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; line-height: 1.5;">
# #                     Security Tip: We will never ask for your password or OTP via email.
# #                 </p>
# #                 <p style="margin: 0; color: #94a3b8; font-size: 12px;">
# #                     This is an automated security alert generated by PulseLIMS. <br>
# #                     &copy; 2026 PulseLIMS. All rights reserved.
# #                 </p>
# #             </div>
            
# #         </div>
# #     </body>
# #     </html>
# #     """
    
# #     message = MessageSchema(
# #         subject="Security Alert: Registration Attempted",
# #         recipients=[target_email],
# #         body=html_content,
# #         subtype=MessageType.html
# #     )

# #     try:
# #         await fast_mail.send_message(message)
# #         masked_email = mask_email(target_email)
        
# #         logger.warning(
# #             "Security Alert dispatched due to registration conflict", 
# #             extra={"action": "security_alert_sent", "target": masked_email}
# #         )
# #     except Exception as e:
# #         masked_email = mask_email(target_email)
        
# #         logger.error(
# #             "Failed to send security alert to %s", 
# #             masked_email, 
# #             extra={"action": "security_alert_failed", "target": masked_email},
# #             exc_info=True
# #         )