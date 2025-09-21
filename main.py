import time
from Authentication.password_utils import verify_password
from Secret_Manager.secret_manager import generate_and_store_otp, get_otp_from_db
from SignupAndLogin.sender import send_code_via_email_or_sms
from Authentication.user_db import get_user_by_username

def login():
    print("=== LOGIN ===")

    # Get username
    username = input("Enter username: ").strip()
    user = get_user_by_username(username)
    if not user:
        print("Error: Username does not exist.")
        return False

