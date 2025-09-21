import random
import os
from dotenv import load_dotenv
import mysql.connector
import time

load_dotenv(dotenv_path='db.env')

def generate_login_otp() -> str:
    """Generate a 6-digit OTP for login."""
    return str(random.randint(100000, 999999))

def save_otp_to_db(username: str, otp: str) -> None:
    """Save OTP with expiry 5 mins into the database."""
    expiry_time = int(time.time()) + 300

    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME")
    )

    cursor = connection.cursor()
    sql = "UPDATE users SET otp_code=%s, otp_expiry=%s WHERE username=%s"
    cursor.execute(sql, (otp, expiry_time, username))
    connection.commit()

    cursor.close()
    connection.close()

def generate_and_store_otp(username: str) -> str:
    """Generate an OTP, save it to the DB with expiry, and return it."""
    otp = generate_login_otp()
    save_otp_to_db(username, otp)
    return otp

def get_otp_from_db(username: str):
    """Get OTP and expiry for a given user.
    Returns tuple (otp_code, otp_expiry) or None if not found.
    """
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME")
    )

    cursor = connection.cursor()
    sql = "SELECT otp_code, otp_expiry FROM users WHERE username=%s"
    cursor.execute(sql, (username,))
    result = cursor.fetchone()

    cursor.close()
    connection.close()

    if result:
        return result[0], result[1]
    return None
