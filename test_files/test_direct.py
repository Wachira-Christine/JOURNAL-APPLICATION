import psycopg2

try:
    # Direct connection without environment variables
    conn = psycopg2.connect(
        host='db.fhhxgifimxcwfplenhmm.supabase.co',
        port=5432,
        user='postgres',
        password='p@$$uu0rde.',  # Your actual password
        database='postgres',
        sslmode='require'
    )
    print("✅ Successfully connected to Supabase with direct credentials!")

    cur = conn.cursor()
    cur.execute("SELECT version();")
    version = cur.fetchone()
    print(f"📊 PostgreSQL version: {version[0]}")

    cur.close()
    conn.close()

except Exception as e:
    print(f"❌ Direct connection failed: {e}")
    print("💡 The password might be incorrect or Supabase project is inactive")