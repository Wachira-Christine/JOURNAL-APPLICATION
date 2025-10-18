import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('../db.env')

try:
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME"),
        sslmode='require'
    )
    print("✅ Successfully connected to Supabase!")

    cur = conn.cursor()

    # Test basic query
    cur.execute("SELECT version();")
    version = cur.fetchone()
    print(f"📊 PostgreSQL version: {version[0]}")

    # Check if users table exists
    cur.execute("""
                SELECT EXISTS (SELECT
                               FROM information_schema.tables
                               WHERE table_schema = 'public'
                                 AND table_name = 'users');
                """)
    table_exists = cur.fetchone()[0]
    print(f"📋 Users table exists: {table_exists}")

    if not table_exists:
        print("🔄 Creating users table...")
        cur.execute("""
                    CREATE TABLE users
                    (
                        id             SERIAL PRIMARY KEY,
                        email          VARCHAR(255) UNIQUE NOT NULL,
                        username       VARCHAR(100) UNIQUE NOT NULL,
                        password_hash  VARCHAR(255)        NOT NULL,
                        otp_code       VARCHAR(6),
                        otp_expires_at TIMESTAMP,
                        is_verified    BOOLEAN   DEFAULT FALSE,
                        created_at     TIMESTAMP DEFAULT NOW(),
                        updated_at     TIMESTAMP DEFAULT NOW()
                    )
                    """)
        conn.commit()
        print("✅ Users table created!")

    cur.close()
    conn.close()

except Exception as e:
    print(f"❌ Supabase connection failed: {e}")
    print("💡 Check your DB_PASS in db.env file")