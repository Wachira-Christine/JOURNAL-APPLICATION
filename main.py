import requests

# Base URL for the Flask backend API - CHANGED to port 5000
API_BASE_URL = "http://localhost:5000"


def login():
    print("LOGIN")
    email = input("Enter your email: ").strip()
    password = input("Enter your password: ").strip()

    # Send login request to Flask backend - CHANGED endpoint and structure
    try:
        resp = requests.post(f"{API_BASE_URL}/signin", json={"email": email, "password": password})
        result = resp.json()
    except requests.RequestException as e:
        print(f"Error connecting to server: {e}")
        return False

    # Handle response - CHANGED for Flask response structure
    if result.get("success"):
        print("Login successful! Access granted.")
        return True
    else:
        # If user exists but needs OTP verification
        if "OTP sent" in result.get("message", ""):
            print("A verification code has been sent to your email.")
            otp_code = input("Enter the 6-digit code: ").strip()

            try:
                verify_resp = requests.post(
                    f"{API_BASE_URL}/verify_otp",  # CHANGED endpoint
                    json={"email": email, "otp": otp_code}  # CHANGED field names
                )
                verify_result = verify_resp.json()
            except requests.RequestException as e:
                print(f"Error connecting to server: {e}")
                return False

            if verify_result.get("success"):  # CHANGED check
                print("Login successful! Access granted.")
                return True
            else:
                print(f"Error: {verify_result.get('message')}")  # CHANGED field
                return False
        else:
            print(f"Error: {result.get('message')}")  # CHANGED field
            return False


def signup():
    print("SIGN UP")
    email = input("Enter your email: ").strip()
    username = input("Enter your username: ").strip()
    password = input("Enter your password: ").strip()

    # Send signup request to Flask backend
    try:
        resp = requests.post(f"{API_BASE_URL}/signup", json={
            "email": email,
            "username": username,
            "password": password
        })
        result = resp.json()
    except requests.RequestException as e:
        print(f"Error connecting to server: {e}")
        return False

    if result.get("success"):
        print("Account created! A verification code has been sent to your email.")
        otp_code = input("Enter the 6-digit code: ").strip()

        try:
            verify_resp = requests.post(
                f"{API_BASE_URL}/verify_otp",
                json={"email": email, "otp": otp_code}
            )
            verify_result = verify_resp.json()
        except requests.RequestException as e:
            print(f"Error connecting to server: {e}")
            return False

        if verify_result.get("success"):
            print("Account verified! You can now login.")
            return True
        else:
            print(f"Verification failed: {verify_result.get('message')}")
            return False
    else:
        print(f"Error: {result.get('message')}")
        return False


def main():
    print("=== Inner Journal Authentication ===")
    print("1. Login")
    print("2. Sign Up")

    choice = input("Choose option (1 or 2): ").strip()

    if choice == "1":
        success = login()
    elif choice == "2":
        success = signup()
    else:
        print("Invalid choice")
        return

    if success:
        print("Welcome to the journal application!")
    else:
        print("Authentication failed.")


if __name__ == "__main__":
    main()