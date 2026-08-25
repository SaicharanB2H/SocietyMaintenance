import smtplib
import logging
import base64
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("email_service")

class EmailService:
    @staticmethod
    def _get_gmail_access_token() -> str:
        """
        Gets a fresh access token from Google OAuth endpoint using the refresh token.
        """
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id": settings.GMAIL_CLIENT_ID,
            "client_secret": settings.GMAIL_CLIENT_SECRET,
            "refresh_token": settings.GMAIL_REFRESH_TOKEN,
            "grant_type": "refresh_token"
        }
        try:
            response = requests.post(token_url, json=payload, timeout=10)
            if response.status_code == 200:
                return response.json().get("access_token")
            else:
                logger.error(f"Failed to refresh Google OAuth token. Status: {response.status_code}, Body: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Exception while refreshing Google OAuth token: {str(e)}")
            return None

    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str) -> bool:
        """
        Sends an HTML email.
        Uses Gmail HTTP API if Gmail credentials are provided (bypasses Render SMTP restrictions).
        Falls back to standard SMTP if SMTP user/password is configured.
        Otherwise logs email content to console (Mock mode).
        """
        # 1. Try Gmail API (HTTP port 443)
        if settings.GMAIL_CLIENT_ID and settings.GMAIL_CLIENT_SECRET and settings.GMAIL_REFRESH_TOKEN:
            access_token = EmailService._get_gmail_access_token()
            if access_token:
                # Construct MIME message
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = settings.EMAIL_FROM or "me"
                msg["To"] = to_email
                msg.attach(MIMEText(html_content, "html"))
                
                # Base64url encode the message raw bytes
                raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
                
                # Gmail API Send endpoint
                send_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                
                try:
                    response = requests.post(send_url, headers=headers, json={"raw": raw_message}, timeout=10)
                    if response.status_code in (200, 201):
                        logger.info(f"Successfully sent email to {to_email} via Gmail API")
                        return True
                    else:
                        logger.error(f"Failed to send email via Gmail API: {response.text}")
                except Exception as e:
                    logger.error(f"Exception while sending via Gmail API: {str(e)}")

        # 2. Try SMTP fallback
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            # Construct email message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
            msg["To"] = to_email
            msg.attach(MIMEText(html_content, "html"))

            try:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    server.starttls()  # Upgrade connection to secure TLS
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(msg["From"], to_email, msg.as_string())
                logger.info(f"Successfully sent email to {to_email} via SMTP")
                return True
            except Exception as e:
                logger.error(f"Failed to send email to {to_email} via SMTP: {str(e)}")
                return False

        # 3. Mock Console Logging fallback
        logger.info("=== [MOCK EMAIL SENT] ===")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body: {html_content}")
        logger.info("=========================")
        return True

    @staticmethod
    def send_status_update_email(
        recipient_email: str,
        complaint_id: str,
        category: str,
        old_status: str,
        new_status: str,
        note: str = None
    ) -> bool:
        """
        Sends an email notifying the resident of a change in complaint status.
        """
        subject = f"Your complaint has been updated: {new_status}"
        
        note_block = f"<p><strong>Admin Note:</strong> {note}</p>" if note else ""
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto;">
                <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h2>Complaint Update Notification</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
                    <p>Hello,</p>
                    <p>Your complaint regarding <strong>{category}</strong> (ID: #{str(complaint_id)[:8]}) has been updated.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Old Status:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #dc2626;">{old_status}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">New Status:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #16a34a;">{new_status}</td>
                        </tr>
                    </table>
                    {note_block}
                    <p>Please log in to the <a href="{settings.FRONTEND_URL}">Society Maintenance Tracker</a> to view details.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888; text-align: center;">This is an automated notification. Please do not reply directly to this email.</p>
                </div>
            </body>
        </html>
        """
        return EmailService.send_email(recipient_email, subject, html_content)

    @staticmethod
    def send_important_notice_email(
        recipient_emails: list[str],
        notice_title: str,
        notice_content: str
    ) -> bool:
        """
        Sends an announcement email to residents for an important notice.
        """
        if not recipient_emails:
            return True
            
        subject = f"IMPORTANT NOTICE: {notice_title}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto;">
                <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h2>Important Society Notice</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
                    <p>Hello Resident,</p>
                    <h3 style="color: #dc2626; margin-top: 0;">{notice_title}</h3>
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; font-style: italic;">
                        {notice_content.replace(chr(10), '<br>')}
                    </div>
                    <p>Please log in to the <a href="{settings.FRONTEND_URL}">Notice Board</a> to see the full list of notices.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888; text-align: center;">This notice was broadcasted by the Society Administration.</p>
                </div>
            </body>
        </html>
        """
        
        success = True
        for email in recipient_emails:
            if not EmailService.send_email(email, subject, html_content):
                success = False
        return success
