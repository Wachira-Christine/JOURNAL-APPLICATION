from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import random
import string
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from password_manager import PasswordManager
from flask_cors import CORS

# Load environment variables
load_dotenv(dotenv_path='db.env')

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

# Add session configuration
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

password_manager = PasswordManager()

# Replace your existing CORS configuration (around line 25) with:
CORS(app,
     origins=['http://127.0.0.1:5000', 'http://localhost:5000', '*'],  # Added '*' for development
     supports_credentials=True,
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])


def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'aws-1-us-east-1.pooler.supabase.com'),
            port=int(os.getenv('DB_PORT', 6543)),
            user=os.getenv('DB_USER', 'postgres.fhhxgifimxcwfplenhmm'),
            password=os.getenv('DB_PASS', 'T30plU4sOJ984nfV'),
            database=os.getenv('DB_NAME', 'postgres'),
            sslmode='require'
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise


# Email configuration (your existing code)
EMAIL_USER = os.getenv("EMAIL_ADDRESS")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))


def send_otp_email(email, otp_code):
    """Send OTP to user's email"""
    try:
        msg = MIMEText(f'Your OTP code is: {otp_code}\nIt will expire in 10 minutes.')
        msg['Subject'] = 'Your Journal App OTP Code'
        msg['From'] = EMAIL_USER
        msg['To'] = email

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False


def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:5000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

# Routes
@app.route('/')
def home():
    # Check if user is already logged in
    if 'user_id' in session:
        return redirect('/journal')  # Redirect to journal if already logged in
    return render_template('welcome.html')


@app.route('/signup', methods=['GET','POST'])
def signup():
    email = request.json.get('email')
    username = request.json.get('username')
    password = request.json.get('password')

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
        if cur.fetchone():
            return jsonify({'success': False, 'message': 'User already exists'})

        # Hash the password
        password_hash = password_manager.hash_password(password)

        # Generate OTP
        otp_code = generate_otp()
        otp_expires = datetime.now() + timedelta(minutes=10)

        # Insert user into database
        cur.execute("""
                    INSERT INTO users (email, username, password_hash, otp_code, otp_expires_at)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id
                    """, (email, username, password_hash, otp_code, otp_expires))

        user_id = cur.fetchone()[0]
        conn.commit()

        # Send OTP email
        if send_otp_email(email, otp_code):
            return jsonify({'success': True, 'message': 'OTP sent to your email'})
        else:
            return jsonify({'success': False, 'message': 'Failed to send OTP'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@app.route('/signin', methods=['POST'])
def signin():
    email = request.json.get('email')
    password = request.json.get('password')

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user exists and get stored password hash
        cur.execute("""
                    SELECT id, username, password_hash, is_verified
                    FROM users
                    WHERE email = %s
                    """, (email,))

        user = cur.fetchone()
        if user:
            user_id, username, password_hash, is_verified = user

            # Verify password
            if password_manager.verify_password(password, password_hash):
                if is_verified:
                    # Set session variables
                    session['user_id'] = user_id
                    session['username'] = username
                    session.permanent = True  # Make session permanent

                    return jsonify({
                        'success': True,
                        'message': 'Login successful',
                        'user_id': user_id,
                        'username': username,
                        'redirect_url': '/dashboard'  # Add redirect URL
                    })
                else:
                    # User exists but not verified
                    otp_code = generate_otp()
                    otp_expires = datetime.now() + timedelta(minutes=10)

                    cur.execute("""
                                UPDATE users
                                SET otp_code       = %s,
                                    otp_expires_at = %s
                                WHERE email = %s
                                """, (otp_code, otp_expires, email))
                    conn.commit()

                    send_otp_email(email, otp_code)
                    return jsonify({
                        'success': False,
                        'message': 'Email not verified. New OTP sent.',
                        'redirect_url': f'/verify-otp.html?email={email}'
                    })
            else:
                return jsonify({'success': False, 'message': 'Invalid password'})
        else:
            return jsonify({'success': False, 'message': 'User not found'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


@app.route('/verify_otp', methods=['POST'])
def verify_otp():
    email = request.json.get('email')
    otp_code = request.json.get('otp')

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Verify OTP
        cur.execute("""
                    UPDATE users
                    SET is_verified    = TRUE,
                        otp_code       = NULL,
                        otp_expires_at = NULL
                    WHERE email = %s
                      AND otp_code = %s
                      AND otp_expires_at > NOW() RETURNING id, username
                    """, (email, otp_code))

        result = cur.fetchone()
        if result:
            user_id, username = result
            conn.commit()

            # Set session variables
            session['user_id'] = user_id
            session['username'] = username
            session.permanent = True

            return jsonify({
                'success': True,
                'message': 'Email verified successfully',
                'user_id': user_id,
                'username': username,
                'redirect_url': '/dashboard'  # Redirect to journal after verification
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid or expired OTP'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


@app.route('/verify-otp.html')
def verify_otp_page():
    email = request.args.get('email')
    return render_template('verify-otp.html', email=email)


@app.route('/resend_otp', methods=['POST'])
def resend_otp():
    email = request.json.get('email')

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user exists
        cur.execute("SELECT username FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        if not user:
            return jsonify({'success': False, 'message': 'User not found'})

        username = user[0]

        # Generate new OTP
        otp_code = generate_otp()
        otp_expires = datetime.now() + timedelta(minutes=10)

        # Update user with new OTP
        cur.execute("""
                    UPDATE users
                    SET otp_code       = %s,
                        otp_expires_at = %s
                    WHERE email = %s
                    """, (otp_code, otp_expires, email))

        conn.commit()

        # Send new OTP email
        if send_otp_email(email, otp_code):
            return jsonify({'success': True, 'message': 'New OTP sent to your email'})
        else:
            return jsonify({'success': False, 'message': 'Failed to send OTP'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect('/')
    return render_template('dashboard.html', username=session['username'])


@app.route('/new-entry')
def new_entry():
    if 'user_id' not in session:
        return redirect('/')
    return render_template('new-entry.html')


# Create a new journal entry - CORRECTED
@app.route('/api/entries', methods=['POST'])
def create_entry():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        data = request.json
        title = data.get('title')
        content = data.get('content')

        if not title or not content:
            return jsonify({'success': False, 'message': 'Title and content are required'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # First, get or create a daily_journals entry for today
        today = datetime.now().date()

        # Check if a daily_journals entry exists for today
        cur.execute("""
                    SELECT id
                    FROM daily_journals
                    WHERE user_id = %s
                      AND entry_date = %s
                    """, (session['user_id'], today))

        daily_journals_entry = cur.fetchone()

        if daily_journals_entry:
            daily_journal_id = daily_journals_entry['id']
        else:
            # Create a new daily_journals entry for today
            cur.execute("""
                        INSERT INTO daily_journals (user_id, entry_date)
                        VALUES (%s, %s) RETURNING id
                        """, (session['user_id'], today))

            daily_journal_id = cur.fetchone()['id']

        # Now create the journal entry
        cur.execute("""
                    INSERT INTO journal_entries (daily_journal_id, entry_title, entry_content)
                    VALUES (%s, %s, %s) RETURNING id, entry_title, entry_content, created_at
                    """, (daily_journal_id, title, content))

        entry = cur.fetchone()
        conn.commit()

        return jsonify({
            'success': True,
            'entry': {
                'id': entry['id'],
                'title': entry['entry_title'],
                'content': entry['entry_content'],
                'date': entry['created_at'].strftime('%d/%m/%Y')
            }
        })

    except Exception as e:
        print(f"Error creating entry: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Get all entries for the logged-in user - CORRECTED
@app.route('/api/entries', methods=['GET'])
def get_entries():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Join with daily_journals to get entries for this user
        cur.execute("""
                    SELECT je.id, je.entry_title, je.entry_content, je.created_at
                    FROM journal_entries je
                             JOIN daily_journals dj ON je.daily_journal_id = dj.id
                    WHERE dj.user_id = %s
                    ORDER BY je.created_at DESC
                    """, (session['user_id'],))

        entries = cur.fetchall()

        # Format entries for frontend
        formatted_entries = [{
            'id': entry['id'],
            'title': entry['entry_title'],
            'content': entry['entry_content'],
            'date': entry['created_at'].strftime('%d/%m/%Y')
        } for entry in entries]

        return jsonify({
            'success': True,
            'entries': formatted_entries
        })

    except Exception as e:
        print(f"Error fetching entries: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Delete an entry - CORRECTED
@app.route('/api/entries/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Make sure the entry belongs to the current user (through daily_journals)
        cur.execute("""
                    DELETE
                    FROM journal_entries
                    WHERE id = %s
                      AND daily_journal_id IN (SELECT id
                                               FROM daily_journals
                                               WHERE user_id = %s)
                        RETURNING id
                    """, (entry_id, session['user_id']))

        deleted = cur.fetchone()
        conn.commit()

        if deleted:
            return jsonify({'success': True, 'message': 'Entry deleted'})
        else:
            return jsonify({'success': False, 'message': 'Entry not found'}), 404

    except Exception as e:
        print(f"Error deleting entry: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Update an entry - CORRECTED
@app.route('/api/entries/<int:entry_id>', methods=['PUT'])
def update_entry(entry_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        data = request.json
        title = data.get('title')
        content = data.get('content')

        if not title or not content:
            return jsonify({'success': False, 'message': 'Title and content are required'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Update the entry (making sure it belongs to the current user)
        cur.execute("""
                    UPDATE journal_entries
                    SET entry_title   = %s,
                        entry_content = %s,
                        updated_at    = CURRENT_TIMESTAMP
                    WHERE id = %s
                      AND daily_journal_id IN (SELECT id
                                               FROM daily_journals
                                               WHERE user_id = %s)
                        RETURNING id, entry_title, entry_content, updated_at
                    """, (title, content, entry_id, session['user_id']))

        entry = cur.fetchone()
        conn.commit()

        if entry:
            return jsonify({
                'success': True,
                'entry': {
                    'id': entry['id'],
                    'title': entry['entry_title'],
                    'content': entry['entry_content'],
                    'date': entry['updated_at'].strftime('%d/%m/%Y')
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Entry not found'}), 404

    except Exception as e:
        print(f"Error updating entry: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# ==================== INTENTIONS API ====================

# Create a new intention
@app.route('/api/intentions', methods=['POST'])
def create_intention():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        data = request.json
        intention_text = data.get('intention_text')
        for_date = data.get('for_date', datetime.now().date())  # Default to today

        if not intention_text:
            return jsonify({'success': False, 'message': 'Intention text is required'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
                    INSERT INTO intentions (user_id, intention_text, for_date, is_completed)
                    VALUES (%s, %s, %s, FALSE) RETURNING id, intention_text, for_date, is_completed
                    """, (session['user_id'], intention_text, for_date))

        intention = cur.fetchone()
        conn.commit()

        return jsonify({
            'success': True,
            'intention': {
                'id': intention['id'],
                'text': intention['intention_text'],
                'date': intention['for_date'].strftime('%Y-%m-%d'),
                'completed': intention['is_completed']
            }
        })

    except Exception as e:
        print(f"Error creating intention: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Get all intentions for the logged-in user
@app.route('/api/intentions', methods=['GET'])
def get_intentions():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        # Get date from query parameter, default to today
        date_str = request.args.get('date', datetime.now().date().isoformat())

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
                    SELECT id, intention_text, for_date, is_completed, completed_at
                    FROM intentions
                    WHERE user_id = %s
                      AND for_date = %s
                    ORDER BY id ASC
                    """, (session['user_id'], date_str))

        intentions = cur.fetchall()

        formatted_intentions = [{
            'id': intention['id'],
            'text': intention['intention_text'],
            'date': intention['for_date'].strftime('%Y-%m-%d'),
            'completed': intention['is_completed'],
            'completed_at': intention['completed_at'].isoformat() if intention['completed_at'] else None
        } for intention in intentions]

        return jsonify({
            'success': True,
            'intentions': formatted_intentions
        })

    except Exception as e:
        print(f"Error fetching intentions: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Toggle intention completion
@app.route('/api/intentions/<int:intention_id>/toggle', methods=['PUT'])
def toggle_intention(intention_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Toggle completion status
        cur.execute("""
                    UPDATE intentions
                    SET is_completed = NOT is_completed,
                        completed_at = CASE
                                           WHEN is_completed = FALSE THEN CURRENT_TIMESTAMP
                                           ELSE NULL
                            END
                    WHERE id = %s
                      AND user_id = %s RETURNING id, intention_text, is_completed
                    """, (intention_id, session['user_id']))

        intention = cur.fetchone()
        conn.commit()

        if intention:
            return jsonify({
                'success': True,
                'intention': {
                    'id': intention['id'],
                    'text': intention['intention_text'],
                    'completed': intention['is_completed']
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Intention not found'}), 404

    except Exception as e:
        print(f"Error toggling intention: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Delete an intention
@app.route('/api/intentions/<int:intention_id>', methods=['DELETE'])
def delete_intention(intention_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
                    DELETE
                    FROM intentions
                    WHERE id = %s
                      AND user_id = %s RETURNING id
                    """, (intention_id, session['user_id']))

        deleted = cur.fetchone()
        conn.commit()

        if deleted:
            return jsonify({'success': True, 'message': 'Intention deleted'})
        else:
            return jsonify({'success': False, 'message': 'Intention not found'}), 404

    except Exception as e:
        print(f"Error deleting intention: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# ==================== CALENDAR EVENTS API ====================

# Create a new calendar event
@app.route('/api/calendar-events', methods=['POST'])
def create_calendar_event():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        data = request.json
        event_title = data.get('event_title')
        event_description = data.get('event_description', '')
        event_date = data.get('event_date')
        event_time = data.get('event_time')

        if not event_title or not event_date:
            return jsonify({'success': False, 'message': 'Title and date are required'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
                    INSERT INTO calendar_events (user_id, event_title, event_description, event_date, event_time)
                    VALUES (%s, %s, %s, %s,
                            %s) RETURNING id, event_title, event_description, event_date, event_time, created_at
                    """, (session['user_id'], event_title, event_description, event_date, event_time))

        event = cur.fetchone()
        conn.commit()

        return jsonify({
            'success': True,
            'event': {
                'id': event['id'],
                'title': event['event_title'],
                'description': event['event_description'],
                'date': event['event_date'].strftime('%Y-%m-%d'),
                'time': event['event_time'].strftime('%H:%M') if event['event_time'] else None
            }
        })

    except Exception as e:
        print(f"Error creating calendar event: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Get all calendar events for the logged-in user
@app.route('/api/calendar-events', methods=['GET'])
def get_calendar_events():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        # Optional: filter by month/year
        month = request.args.get('month')
        year = request.args.get('year')

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if month and year:
            cur.execute("""
                        SELECT id, event_title, event_description, event_date, event_time
                        FROM calendar_events
                        WHERE user_id = %s
                          AND EXTRACT(MONTH FROM event_date) = %s
                          AND EXTRACT(YEAR FROM event_date) = %s
                        ORDER BY event_date ASC, event_time ASC
                        """, (session['user_id'], month, year))
        else:
            cur.execute("""
                        SELECT id, event_title, event_description, event_date, event_time
                        FROM calendar_events
                        WHERE user_id = %s
                        ORDER BY event_date ASC, event_time ASC
                        """, (session['user_id'],))

        events = cur.fetchall()

        formatted_events = [{
            'id': event['id'],
            'title': event['event_title'],
            'description': event['event_description'],
            'date': event['event_date'].strftime('%Y-%m-%d'),
            'time': event['event_time'].strftime('%H:%M') if event['event_time'] else None
        } for event in events]

        return jsonify({
            'success': True,
            'events': formatted_events
        })

    except Exception as e:
        print(f"Error fetching calendar events: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Update a calendar event
@app.route('/api/calendar-events/<int:event_id>', methods=['PUT'])
def update_calendar_event(event_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        data = request.json
        event_title = data.get('event_title')
        event_description = data.get('event_description')
        event_date = data.get('event_date')
        event_time = data.get('event_time')

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
                    UPDATE calendar_events
                    SET event_title       = %s,
                        event_description = %s,
                        event_date        = %s,
                        event_time        = %s,
                        updated_at        = CURRENT_TIMESTAMP
                    WHERE id = %s
                      AND user_id = %s RETURNING id, event_title, event_description, event_date, event_time
                    """, (event_title, event_description, event_date, event_time, event_id, session['user_id']))

        event = cur.fetchone()
        conn.commit()

        if event:
            return jsonify({
                'success': True,
                'event': {
                    'id': event['id'],
                    'title': event['event_title'],
                    'description': event['event_description'],
                    'date': event['event_date'].strftime('%Y-%m-%d'),
                    'time': event['event_time'].strftime('%H:%M') if event['event_time'] else None
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Event not found'}), 404

    except Exception as e:
        print(f"Error updating calendar event: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Delete a calendar event
@app.route('/api/calendar-events/<int:event_id>', methods=['DELETE'])
def delete_calendar_event(event_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
                    DELETE
                    FROM calendar_events
                    WHERE id = %s
                      AND user_id = %s RETURNING id
                    """, (event_id, session['user_id']))

        deleted = cur.fetchone()
        conn.commit()

        if deleted:
            return jsonify({'success': True, 'message': 'Event deleted'})
        else:
            return jsonify({'success': False, 'message': 'Event not found'}), 404

    except Exception as e:
        print(f"Error deleting calendar event: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# ==================== MOODS API ====================

# Get all available moods
@app.route('/api/moods', methods=['GET'])
def get_all_moods():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
                    SELECT id, mood_name, mood_emoji, description
                    FROM moods
                    ORDER BY id ASC
                    """)

        moods = cur.fetchall()

        formatted_moods = [{
            'id': mood['id'],
            'name': mood['mood_name'],
            'emoji': mood['mood_emoji'],
            'description': mood['description']
        } for mood in moods]

        return jsonify({
            'success': True,
            'moods': formatted_moods
        })

    except Exception as e:
        print(f"Error fetching moods: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Set mood for today (updates daily_journals table)
@app.route('/api/moods/today', methods=['POST'])
def set_today_mood():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        data = request.json
        mood_id = data.get('mood_id')

        if not mood_id:
            return jsonify({'success': False, 'message': 'Mood ID is required'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        today = datetime.now().date()

        # Check if a daily_journals entry exists for today
        cur.execute("""
                    SELECT id
                    FROM daily_journals
                    WHERE user_id = %s
                      AND entry_date = %s
                    """, (session['user_id'], today))

        daily_journal = cur.fetchone()

        if daily_journal:
            # Update existing entry
            cur.execute("""
                        UPDATE daily_journals
                        SET mood_id = %s
                        WHERE id = %s RETURNING id, mood_id
                        """, (mood_id, daily_journal['id']))
        else:
            # Create new daily_journals entry with mood
            cur.execute("""
                        INSERT INTO daily_journals (user_id, entry_date, mood_id)
                        VALUES (%s, %s, %s) RETURNING id, mood_id
                        """, (session['user_id'], today, mood_id))

        result = cur.fetchone()
        conn.commit()

        # Get the mood details
        cur.execute("""
                    SELECT id, mood_name, mood_emoji, description
                    FROM moods
                    WHERE id = %s
                    """, (mood_id,))

        mood = cur.fetchone()

        return jsonify({
            'success': True,
            'mood': {
                'id': mood['id'],
                'name': mood['mood_name'],
                'emoji': mood['mood_emoji'],
                'description': mood['description']
            }
        })

    except Exception as e:
        print(f"Error setting mood: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Get today's mood
@app.route('/api/moods/today', methods=['GET'])
def get_today_mood():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        today = datetime.now().date()

        # Get today's mood from daily_journals
        cur.execute("""
                    SELECT m.id, m.mood_name, m.mood_emoji, m.description
                    FROM daily_journals dj
                             JOIN moods m ON dj.mood_id = m.id
                    WHERE dj.user_id = %s
                      AND dj.entry_date = %s
                    """, (session['user_id'], today))

        mood = cur.fetchone()

        if mood:
            return jsonify({
                'success': True,
                'mood': {
                    'id': mood['id'],
                    'name': mood['mood_name'],
                    'emoji': mood['mood_emoji'],
                    'description': mood['description']
                }
            })
        else:
            return jsonify({
                'success': True,
                'mood': None
            })

    except Exception as e:
        print(f"Error fetching today's mood: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# ==================== EVENTS API (for Today's Events section) ====================

# Create a new event
@app.route('/api/events', methods=['POST'])
def create_event():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        data = request.json
        title = data.get('title')
        description = data.get('description', '')
        event_date = data.get('event_date', datetime.now().date())
        event_time = data.get('event_time')

        if not title:
            return jsonify({'success': False, 'message': 'Title is required'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
                    INSERT INTO events (user_id, title, description, event_date, event_time)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id, title, description, event_date, event_time
                    """, (session['user_id'], title, description, event_date, event_time))

        event = cur.fetchone()
        conn.commit()

        return jsonify({
            'success': True,
            'event': {
                'id': event['id'],
                'title': event['title'],
                'description': event['description'],
                'date': event['event_date'].strftime('%Y-%m-%d') if event['event_date'] else None,
                'time': event['event_time'].strftime('%H:%M') if event['event_time'] else None
            }
        })

    except Exception as e:
        print(f"Error creating event: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Get all events for today
@app.route('/api/events/today', methods=['GET'])
def get_today_events():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        today = datetime.now().date()

        cur.execute("""
                    SELECT id, title, description, event_date, event_time
                    FROM events
                    WHERE user_id = %s
                      AND event_date = %s
                    ORDER BY event_time ASC NULLS LAST
                    """, (session['user_id'], today))

        events = cur.fetchall()

        formatted_events = [{
            'id': event['id'],
            'title': event['title'],
            'description': event['description'],
            'date': event['event_date'].strftime('%Y-%m-%d') if event['event_date'] else None,
            'time': event['event_time'].strftime('%H:%M') if event['event_time'] else None
        } for event in events]

        return jsonify({
            'success': True,
            'events': formatted_events
        })

    except Exception as e:
        print(f"Error fetching events: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Update an event
@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        data = request.json
        title = data.get('title')
        description = data.get('description')

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
                    UPDATE events
                    SET title       = %s,
                        description = %s
                    WHERE id = %s
                      AND user_id = %s RETURNING id, title, description, event_date, event_time
                    """, (title, description, event_id, session['user_id']))

        event = cur.fetchone()
        conn.commit()

        if event:
            return jsonify({
                'success': True,
                'event': {
                    'id': event['id'],
                    'title': event['title'],
                    'description': event['description'],
                    'date': event['event_date'].strftime('%Y-%m-%d') if event['event_date'] else None,
                    'time': event['event_time'].strftime('%H:%M') if event['event_time'] else None
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Event not found'}), 404

    except Exception as e:
        print(f"Error updating event: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# Delete an event
@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
                    DELETE
                    FROM events
                    WHERE id = %s
                      AND user_id = %s RETURNING id
                    """, (event_id, session['user_id']))

        deleted = cur.fetchone()
        conn.commit()

        if deleted:
            return jsonify({'success': True, 'message': 'Event deleted'})
        else:
            return jsonify({'success': False, 'message': 'Event not found'}), 404

    except Exception as e:
        print(f"Error deleting event: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


@app.route('/journal')
def journal():
    if 'user_id' not in session:
        return redirect('/')
    return render_template('journal.html')

@app.route('/calendar')
def calendar():
    if 'user_id' not in session:
        return redirect('/')
    return render_template('calendar.html')

@app.route('/login')
def login_page():
    if 'user_id' in session:
        return redirect('/dashboard')
    return render_template('index.html')

@app.route('/admin-login')
def admin_login_page():
    return render_template('admin-login.html')

@app.route('/admin-dashboard')
def admin_dashboard_page():
    return render_template('admin-dashboard.html')


@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')


# Health check and debug routes (your existing code)
@app.route('/health')
def health():
    pass


@app.route('/debug-users')
def debug_users():
    pass


if __name__ == '__main__':
    app.run(debug=True, port=5000)