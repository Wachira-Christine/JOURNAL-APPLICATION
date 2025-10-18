# test_password_utils.py
from password_manager import PasswordManager

def test_password_manager():
    manager=PasswordManager()
    password = "Brezzy123!"
    hashed = manager.hash_password(password)
    
    assert hashed != password, "Hashed password should not be the same as plain text"
    assert manager.verify_password(password,hashed)
    assert not manager.verify_password("WrongPassword", hashed)

    print("All tests passed!")

if __name__ == "__main__":
    test_password_manager()
    print("Tests completed successfully.")
