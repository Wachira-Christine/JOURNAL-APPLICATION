import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os
from secret_manager import generate_and_store_otp

# Load email credentials from .env
load_dotenv(dotenv_path='db.env')

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))

def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email using SMTP with TLS."""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Connect to SMTP server
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Secure connection
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)

        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False

def send_login_otp(username: str, user_email: str) -> None:
    """Generate OTP, save it, and send it via email."""
    otp_code = generate_and_store_otp(username)
    subject = "Your Login OTP"
    body = f"Hello {username},\n\nYour OTP code is: {otp_code}\nIt is valid for 5 minutes."

    if send_email(user_email, subject, body):
        print(f"✅ OTP successfully sent to {user_email}")
    else:
        print(f"❌ Failed to send OTP to {user_email}")

# Example usage
if __name__ == "__main__":
    import random

    recipient_email = "joy.mutinda@strathmore.edu"  # manual recipient
    otp = str(random.randint(100000, 999999))       # generate OTP manually
    subject = "Your Login OTP"
    body = f"Hello,\n\nYour OTP code is: {otp}\nIt is valid for 5 minutes."

    send_email(recipient_email, subject, body)
