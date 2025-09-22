import os
import random
import time
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

# Load environment variables from db.env
load_dotenv(dotenv_path='db.env')

# Fetch DB credentials safely
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 47785))  # default MySQL port if missing
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# Debug prints to confirm env loading
print("DB_HOST =", DB_HOST)
print("DB_PORT =", DB_PORT)
print("DB_USER =", DB_USER)

def get_db_connection():
    """Create and return a new MySQL DB connection."""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return connection
    except Error as e:
        print("❌ Error connecting to database:", e)
        raise

def generate_login_otp() -> str:
    """Generate a 6-digit OTP for login."""
    return str(random.randint(100000, 999999))

def save_otp_to_db(username: str, otp: str) -> None:
    """Save OTP with expiry 5 minutes into the database."""
    expiry_time = int(time.time()) + 300  # 5 minutes from now

    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        sql = "UPDATE users SET otp_code=%s, otp_expiry=%s WHERE username=%s"
        cursor.execute(sql, (otp, expiry_time, username))
        connection.commit()
    except Error as e:
        print("❌ Error saving OTP to database:", e)
        raise
    finally:
        cursor.close()
        connection.close()

def generate_and_store_otp(username: str) -> str:
    """Generate an OTP, save it to the DB, and return it."""
    otp = generate_login_otp()
    save_otp_to_db(username, otp)
    return otp

def get_otp_from_db(username: str):
    """Get OTP and expiry for a given user.
    Returns tuple (otp_code, otp_expiry) or None if not found.
    """
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        sql = "SELECT otp_code, otp_expiry FROM users WHERE username=%s"
        cursor.execute(sql, (username,))
        result = cursor.fetchone()
        if result:
            return result[0], result[1]
        return None
    except Error as e:
        print("❌ Error fetching OTP from database:", e)
        raise
    finally:
        cursor.close()
        connection.close()
