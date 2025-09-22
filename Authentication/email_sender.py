# email_sender.py
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os
from secret_manager import generate_and_store_otp, get_otp_from_db  # import from your existing file
import mysql.connector

# Load environment variables
load_dotenv(dotenv_path="db.env")

EMAIL_USER = os.getenv("EMAIL_ADDRESS")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))

DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

# ---------- helper: fetch email ----------
def get_user_email(username: str) -> str | None:
    """Fetch user email from DB given username."""
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME
    )
    cur = conn.cursor()
    sql = "SELECT email FROM users WHERE username=%s LIMIT 1"
    cur.execute(sql, (username,))
    result = cur.fetchone()
    cur.close()
    conn.close()
    return result[0] if result else None

# ---------- main sender ----------
def send_login_otp(username: str):
    """Generate OTP via secret_manager, get email from DB, and send email."""
    # generate and save OTP in DB
    otp = generate_and_store_otp(username)

    # get email from DB
    user_email = get_user_email(username)
    if not user_email:
        print(f"❌ No email found for {username}")
        return False

    # prepare email
    body = f"""
Hello {username},

Your one-time login code is: {otp}
This code will expire in 5 minutes.

Do not share this code with anyone.
"""
    msg = MIMEText(body)
    msg["Subject"] = "Your Journal App OTP"
    msg["From"] = EMAIL_USER
    msg["To"] = user_email

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
        print(f"✅ OTP sent to {user_email}")
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
       return False

# ---------- Example usage ----------
