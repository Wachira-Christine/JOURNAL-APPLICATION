import requests


def test_signup():
    print("🧪 Testing user registration...")

    try:
        response = requests.post('http://localhost:5000/signup', json={
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'testpass123'
        })

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ User registered successfully!")
                print(f"📧 OTP should be sent to: test@example.com")
            else:
                print(f"❌ Registration failed: {data.get('message')}")

    except Exception as e:
        print(f"❌ Error: {e}")


def test_health():
    print("🏥 Testing health endpoint...")
    try:
        response = requests.get('http://localhost:5000/health')
        print(f"Health Status: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")


if __name__ == "__main__":
    test_health()
    print("\n" + "=" * 50 + "\n")
    test_signup()