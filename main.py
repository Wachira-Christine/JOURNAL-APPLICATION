import requests

# Base URL for the backend API
API_BASE_URL = "http://localhost:3000/api/auth"

def login():
    print("LOGIN")
    email = input("Enter your email: ").strip()
    password = input("Enter your password: ").strip()

    #Send login request to backend
    try:
        resp = requests.post(f"{API_BASE_URL}/login", json={"email": email, "password": password})
        result = resp.json()
    except requests.RequestException as e:
        print(f"Error connecting to server: {e}")
        return False

    #Handle response
    if resp.ok:
        if result.get("requiresVerification"):
            print("A verification code has been sent to your email.")
            otp_code = input("Enter the 6-digit code: ").strip()
            try:
                verify_resp = requests.post(
                    f"{API_BASE_URL}/verify-otp",
                    json={"email": email, "otpCode": otp_code, "otpType": "EMAIL_VERIFICATION"}
                )
                verify_result = verify_resp.json()
            except requests.RequestException as e:
                print(f"Error connecting to server: {e}")
                return False

            if verify_resp.ok:
                print("Login successful! Access granted.")
                return True
            else:
                print(f"Error: {verify_result.get('error')}")
                return False
        else:
            print("Login successful! Access granted.")
            return True
    else:
        print(f"Error: {result.get('error')}")
        return False

if __name__ == "__main__":
    if login():
        print("Welcome to the journal application!")
    else:
        print("Login failed.")
