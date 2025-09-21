import random
import mysql.connector
import time

def generate_login_otp() -> str:
    """Generate a 6-digit OTP for login."""
    return str(random.randint(100000, 999999))

def save_otp_to_db(username: str, otp: str) -> None:
    """Save OTP with expiry 5 mins into the database."""
    expiry_time = int(time.time()) + 300

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="0000",
        database="journal_app"
    )

    cursor = connection.cursor()
    sql = "UPDATE users SET otp_code=%s, otp_expiry=%s WHERE username=%s"
    cursor.execute(sql, (otp, expiry_time, username))
    connection.commit()

    cursor.close()
    connection.close()


