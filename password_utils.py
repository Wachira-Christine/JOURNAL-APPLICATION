# password_utils.py
import bcrypt

def hash_password(plain_text_password: str) -> str:
    """
    Hash a plain-text password with bcrypt.
    Returns the hashed password as a UTF-8 string.
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_text_password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_text_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a hashed password.
    Returns True if they match, False otherwise.
    """
    return bcrypt.checkpw(plain_text_password.encode('utf-8'), hashed_password.encode('utf-8'))
