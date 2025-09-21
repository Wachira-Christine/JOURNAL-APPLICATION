# test_password_utils.py
from password_utils import hash_password, verify_password

def test_password_functions():
    password = "SuperSecure123!"
    hashed = hash_password(password)
    
    assert verify_password(password, hashed) == True
    assert verify_password("WrongPassword", hashed) == False

    print("All tests passed!")

if __name__ == "__main__":
    test_password_functions()
