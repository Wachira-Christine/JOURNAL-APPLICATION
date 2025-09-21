# password_utils.py
import bcrypt


class PasswordManager:
    "This class handles password hashing and verification using bcrypt."

    def __init__(self,rounds: int = 12):
        self.rounds = rounds

    def hash_password(self, plain_text_password: str) -> str:   
        hashed = bcrypt.hashpw(plain_text_password.encode('utf-8'), bcrypt.gensalt(self.rounds))
        return hashed.decode('utf-8')
    
    def verify_password(self, plain_text_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_text_password.encode('utf-8'), hashed_password.encode('utf-8'))