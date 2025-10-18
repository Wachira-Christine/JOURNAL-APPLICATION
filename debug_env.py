import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('db.env')

# Debug: Print all environment variables
print("🔍 Checking environment variables:")
print(f"DB_HOST: {os.getenv('DB_HOST')}")
print(f"DB_PORT: {os.getenv('DB_PORT')}")
print(f"DB_USER: {os.getenv('DB_USER')}")
print(f"DB_PASS: {os.getenv('DB_PASS')} (first 3 chars: {os.getenv('DB_PASS')[:3] if os.getenv('DB_PASS') else 'None'})")
print(f"DB_NAME: {os.getenv('DB_NAME')}")