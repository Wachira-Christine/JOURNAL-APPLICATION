import random
import mysql.connector
import time

def generate_login_otp() -> str:
    """Generate a 6-digit OTP for login."""
    return str(random.randint(100000, 999999))


