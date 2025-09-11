import os
import sqlite3
import threading
import time
import signal
import google.generativeai as genai 
import sys
import psutil
import json
import logging
import secrets
import smtplib
import subprocess
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, jsonify, g, request, send_from_directory, session
from flask_cors import CORS
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import uuid

# Configure Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# --- Logging ---
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/server.log') if os.path.exists('logs') else logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# --- Settings ---
PORT = int(os.environ.get("PORT", 5000))
GOOGLE_CLIENT_ID = "957687109285-gs24ojtjhjkatpi7n0rrpb1c57tf95e2.apps.googleusercontent.com"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "rootzsu_bot_v3.db")
BOT_STATUS_FILE = os.path.join(BASE_DIR, "bot_status.txt")
START_TIME = time.time()

app = Flask(__name__, static_folder='public', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')
CORS(app)

# --- Bot Status Management ---
def update_bot_status():
    """Update bot status file to indicate server is running"""
    try:
        with open(BOT_STATUS_FILE, 'w') as f:
            f.write(f"Server running at {time.time()}")
    except Exception as e:
        logger.error(f"Failed to update bot status: {e}")

def check_bot_process():
    """Check if bot process is running"""
    try:
        # Check if bot.py process is running
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                cmdline = proc.info['cmdline']
                if cmdline and 'bot.py' in ' '.join(cmdline):
                    return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        return False
    except Exception as e:
        logger.error(f"Error checking bot process: {e}")
        return False

def start_bot_if_needed():
    """Start bot process if it's not running"""
    if not check_bot_process():
        try:
            logger.info("🤖 Starting Telegram bot...")
            subprocess.Popen([sys.executable, 'bot.py'], 
                           stdout=subprocess.PIPE, 
                           stderr=subprocess.PIPE)
            logger.info("✅ Bot process started")
        except Exception as e:
            logger.error(f"❌ Failed to start bot: {e}")

# --- Admin Credentials ---
ADMIN_USERNAME = "aishch_admin2012"
ADMIN_PASSWORD_HASH = generate_password_hash("alpha_rootzsu-admin2012")
ADMIN_PHONE = "+380934585751"

# --- Database ---
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        try:
            db = g._database = sqlite3.connect(DB_FILE)
            db.row_factory = sqlite3.Row
        except sqlite3.Error as e:
            logger.error(f"DB connection error: {e}")
            return None
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def setup_database():
    """
    Checks and sets up the database, ensuring all necessary tables and columns exist.
    """
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Create users table with coins
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT UNIQUE,
        google_id TEXT UNIQUE,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        avatar_url TEXT,
        join_date TEXT,
        creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_admin BOOLEAN DEFAULT 0,
        is_banned BOOLEAN DEFAULT 0,
        ban_reason TEXT,
        coins INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        settings TEXT DEFAULT '{}'
    )""")

    # Create services table with categories
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS services (
        service_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'basic',
        price_usd REAL,
        price_eur REAL,
        price_uah REAL,
        price_coins INTEGER,
        is_active BOOLEAN DEFAULT 1,
        difficulty_level TEXT DEFAULT 'beginner',
        estimated_time TEXT DEFAULT '1-2 hours'
    )""")

    # Create orders table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        service_id INTEGER,
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'usd',
        price_paid REAL,
        coins_paid INTEGER,
        order_details TEXT,
        admin_notes TEXT,
        creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        completion_date TEXT,
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (service_id) REFERENCES services (service_id)
    )""")

    # Create reviews table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        service_id INTEGER,
        order_id INTEGER,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        is_approved BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (service_id) REFERENCES services (service_id),
        FOREIGN KEY (order_id) REFERENCES orders (order_id)
    )""")

    # Create admins table with 2FA
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        two_fa_secret TEXT,
        is_2fa_enabled BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Create 2FA codes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS two_fa_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        is_used BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins (id)
    )""")

    # Create news table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS news (
        news_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id INTEGER,
        is_published BOOLEAN DEFAULT 1,
        priority INTEGER DEFAULT 0,
        creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES admins (id)
    )""")

    # Create donations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS donations (
        donation_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount_usd REAL,
        message TEXT,
        is_anonymous BOOLEAN DEFAULT 0,
        creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
    )""")

    # Create coin transactions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS coin_transactions (
        transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount INTEGER,
        transaction_type TEXT, -- 'purchase', 'spend', 'refund', 'bonus'
        description TEXT,
        order_id INTEGER,
        creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (order_id) REFERENCES orders (order_id)
    )""")

    # Create chat sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_sessions (
        session_id TEXT PRIMARY KEY,
        user_id INTEGER,
        title TEXT DEFAULT 'New Chat',
        creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        last_message_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
    )""")

    # Create chat messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        role TEXT, -- 'user' or 'assistant'
        content TEXT,
        creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions (session_id)
    )""")

    # Create support tickets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS support_tickets (
        ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        category TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'normal',
        admin_response TEXT,
        creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
    )""")

    # Create receipts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS receipts (
        receipt_id TEXT PRIMARY KEY,
        order_id INTEGER,
        user_id INTEGER,
        receipt_data TEXT,
        creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (order_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id)
    )""")

    # Insert default admin
    cursor.execute("SELECT * FROM admins WHERE username = ?", (ADMIN_USERNAME,))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO admins (username, password_hash, phone) VALUES (?, ?, ?)", 
                      (ADMIN_USERNAME, ADMIN_PASSWORD_HASH, ADMIN_PHONE))
        logger.info("Default admin user created.")

    # Insert enhanced services
    cursor.execute("SELECT COUNT(*) FROM services")
    if cursor.fetchone()[0] == 0:
        enhanced_services = [
            # Basic Services
            ("PC Setup & Configuration", "Complete setup and optimization of your personal computer", "basic", 25.00, 23.00, 950.00, 250, "beginner", "2-3 hours"),
            ("Mobile Device Setup", "Configuration and optimization of smartphones and tablets", "basic", 15.00, 14.00, 570.00, 150, "beginner", "1-2 hours"),
            ("Software Installation", "Installation and configuration of essential software", "basic", 20.00, 18.50, 760.00, 200, "beginner", "1-2 hours"),
            ("System Troubleshooting", "Diagnosis and repair of system issues", "basic", 30.00, 28.00, 1140.00, 300, "intermediate", "2-4 hours"),
            ("Virus Removal & Security", "Complete malware removal and security setup", "basic", 35.00, 32.00, 1330.00, 350, "intermediate", "2-3 hours"),
            ("Network Configuration", "Setup and optimization of network connections", "basic", 25.00, 23.00, 950.00, 250, "intermediate", "1-3 hours"),
            ("Data Recovery", "Recovery of lost or corrupted data", "basic", 50.00, 46.00, 1900.00, 500, "intermediate", "4-8 hours"),
            
            # Advanced Services
            ("Bootloader Unlock", "Unlock bootloader for custom ROM installation", "advanced", 40.00, 37.00, 1520.00, 400, "advanced", "1-2 hours"),
            ("Root Installation", "Install root access on Android devices", "advanced", 35.00, 32.00, 1330.00, 350, "advanced", "1-2 hours"),
            ("Custom ROM Flashing", "Install custom firmware on mobile devices", "advanced", 60.00, 55.00, 2280.00, 600, "expert", "2-4 hours"),
            ("Brick Recovery", "Recover devices from software brick state", "advanced", 80.00, 74.00, 3040.00, 800, "expert", "4-8 hours"),
            ("Bootloop Fix", "Fix devices stuck in boot loop", "advanced", 45.00, 42.00, 1710.00, 450, "advanced", "2-3 hours"),
            ("Custom Kernel Installation", "Install optimized kernels for better performance", "advanced", 50.00, 46.00, 1900.00, 500, "expert", "2-3 hours"),
            ("TWRP Recovery Installation", "Install custom recovery for advanced users", "advanced", 30.00, 28.00, 1140.00, 300, "advanced", "1-2 hours"),
        ]
        cursor.executemany(
            "INSERT INTO services (name, description, category, price_usd, price_eur, price_uah, price_coins, difficulty_level, estimated_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            enhanced_services
        )
        logger.info("Enhanced services added.")

    # Insert sample news
    cursor.execute("SELECT COUNT(*) FROM news")
    if cursor.fetchone()[0] == 0:
        sample_news = [
            ("Welcome to Rootzsu Services!", "We're excited to launch our new platform with enhanced features including coin system, advanced mobile services, and improved user experience.", 1, 1, 2),
            ("New Advanced Services Available", "We've added specialized services for advanced users including bootloader unlock, custom ROM flashing, and brick recovery.", 1, 1, 1),
            ("Coin System Launch", "Introducing our new coin system! Purchase coins for better rates and exclusive services.", 1, 1, 1),
        ]
        cursor.executemany(
            "INSERT INTO news (title, content, author_id, is_published, priority) VALUES (?, ?, ?, ?, ?)",
            sample_news
        )
        logger.info("Sample news added.")

    conn.commit()
    conn.close()
    logger.info("Database setup complete.")

# --- Helper Functions ---
def generate_2fa_code():
    return str(secrets.randbelow(900000) + 100000)

def send_sms_code(phone, code):
    # In a real implementation, you would use an SMS service like Twilio
    # For demo purposes, we'll just log it
    logger.info(f"SMS Code {code} would be sent to {phone}")
    return True

def add_coins_to_user(user_id, amount, transaction_type, description, order_id=None):
    db = get_db()
    db.execute("UPDATE users SET coins = coins + ? WHERE user_id = ?", (amount, user_id))
    db.execute("""
        INSERT INTO coin_transactions (user_id, amount, transaction_type, description, order_id)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, amount, transaction_type, description, order_id))
    db.commit()

def generate_receipt_id():
    return f"RCP-{datetime.now().strftime('%Y%m%d')}-{secrets.token_hex(4).upper()}"

# --- API Endpoints ---

# System Status (Enhanced)
@app.route('/api/status', methods=['GET'])
def get_status():
    """Enhanced system status with bot monitoring"""
    db = get_db()
    if not db: 
        return jsonify({"error": "Database not available"}), 500
    
    # Update our status
    update_bot_status()
    
    user_count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    active_orders = db.execute("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'in_progress')").fetchone()[0]
    completed_orders = db.execute("SELECT COUNT(*) FROM orders WHERE status = 'completed'").fetchone()[0]
    total_revenue = db.execute("SELECT SUM(price_paid) FROM orders WHERE status = 'completed'").fetchone()[0] or 0
    
    # Check bot status more thoroughly
    bot_online = check_bot_process() or (os.path.exists(BOT_STATUS_FILE) and (time.time() - os.path.getmtime(BOT_STATUS_FILE)) < 120)
    uptime = time.time() - START_TIME
    
    # Get system metrics safely
    try:
        cpu_usage = psutil.cpu_percent(interval=0.1)
        ram_usage = psutil.virtual_memory().percent
        disk_usage = psutil.disk_usage('/').percent
        server_load = os.getloadavg()[0] if hasattr(os, 'getloadavg') else 0
    except Exception as e:
        logger.warning(f"Failed to get system metrics: {e}")
        cpu_usage = ram_usage = disk_usage = server_load = 0
    
    return jsonify({
        "cpu_usage": cpu_usage,
        "ram_usage": ram_usage,
        "disk_usage": disk_usage,
        "user_count": user_count,
        "active_orders": active_orders,
        "completed_orders": completed_orders,
        "total_revenue": round(total_revenue, 2),
        "bot_online": bot_online,
        "uptime_hours": round(uptime / 3600, 1),
        "server_load": server_load,
        "server_status": "healthy",
        "last_update": datetime.now().isoformat()
    })

# Enhanced Gemini Chat with History
@app.route('/api/gemini/chat', methods=['POST'])
def gemini_chat():
    data = request.get_json() or {}
    message = data.get("message") or data.get("prompt")
    session_id = data.get("session_id")
    user_id = data.get("user_id")

    if not message:
        return jsonify({"error": "No message provided"}), 400

    db = get_db()
    
    # Create new session if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
        if user_id:
            db.execute("""
                INSERT INTO chat_sessions (session_id, user_id, title)
                VALUES (?, ?, ?)
            """, (session_id, user_id, message[:50] + "..." if len(message) > 50 else message))
            db.commit()

    try:
        # Get chat history
        history = []
        if session_id:
            messages = db.execute("""
                SELECT role, content FROM chat_messages 
                WHERE session_id = ? ORDER BY creation_date ASC
            """, (session_id,)).fetchall()
            
            for msg in messages:
                history.append({
                    "role": msg["role"],
                    "parts": [msg["content"]]
                })

        # Add current user message to history
        history.append({
            "role": "user",
            "parts": [message]
        })

        model = genai.GenerativeModel("gemini-1.5-flash")
        chat = model.start_chat(history=history[:-1])  # Exclude the current message from history
        response = chat.send_message(message)
        
        # Save messages to database
        if session_id:
            db.execute("""
                INSERT INTO chat_messages (session_id, role, content)
                VALUES (?, ?, ?)
            """, (session_id, "user", message))
            
            db.execute("""
                INSERT INTO chat_messages (session_id, role, content)
                VALUES (?, ?, ?)
            """, (session_id, "assistant", response.text))
            
            # Update session last message date
            db.execute("""
                UPDATE chat_sessions SET last_message_date = CURRENT_TIMESTAMP
                WHERE session_id = ?
            """, (session_id,))
            
            db.commit()
        
        return jsonify({
            "reply": response.text,
            "session_id": session_id
        })
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return jsonify({"error": str(e)}), 500

# Chat Sessions Management
@app.route('/api/chat/sessions', methods=['GET'])
def get_chat_sessions():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
    
    db = get_db()
    sessions = db.execute("""
        SELECT session_id, title, creation_date, last_message_date
        FROM chat_sessions WHERE user_id = ?
        ORDER BY last_message_date DESC
    """, (user_id,)).fetchall()
    
    return jsonify([dict(s) for s in sessions])

@app.route('/api/chat/sessions/<session_id>', methods=['DELETE'])
def delete_chat_session(session_id):
    db = get_db()
    db.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    db.execute("DELETE FROM chat_sessions WHERE session_id = ?", (session_id,))
    db.commit()
    return jsonify({"message": "Session deleted"})

@app.route('/api/chat/sessions/<session_id>/messages', methods=['GET'])
def get_chat_messages(session_id):
    db = get_db()
    messages = db.execute("""
        SELECT role, content, creation_date FROM chat_messages
        WHERE session_id = ? ORDER BY creation_date ASC
    """, (session_id,)).fetchall()
    
    return jsonify([dict(m) for m in messages])

# Google OAuth (Enhanced)
@app.route('/api/auth/google', methods=['POST'])
def auth_google():
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({"message": "Token is missing"}), 400

    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        google_id = idinfo['sub']
        email = idinfo.get('email')
        first_name = idinfo.get('given_name')
        last_name = idinfo.get('family_name')
        avatar_url = idinfo.get('picture')

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE google_id = ? OR (email = ? AND google_id IS NULL)", 
                         (google_id, email)).fetchone()

        if user:
            # Check if user is banned
            if user['is_banned']:
                return jsonify({"message": f"Account banned: {user['ban_reason'] or 'No reason provided'}"}), 403
            
            # Update existing user
            db.execute("""
                UPDATE users 
                SET google_id = ?, email = ?, first_name = ?, last_name = ?, avatar_url = ?
                WHERE user_id = ?
            """, (google_id, email, first_name, last_name, avatar_url, user['user_id']))
            user = db.execute("SELECT * FROM users WHERE user_id = ?", (user['user_id'],)).fetchone()
        else:
            # Create new user with welcome bonus
            cursor = db.execute("""
                INSERT INTO users (google_id, email, first_name, last_name, avatar_url, username, join_date, creation_date, coins)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (google_id, email, first_name, last_name, avatar_url, 
                 email.split('@')[0] if email else google_id, 
                 datetime.now().isoformat(), datetime.now().isoformat(), 100))
            
            user_id = cursor.lastrowid
            # Add welcome bonus transaction
            add_coins_to_user(user_id, 100, 'bonus', 'Welcome bonus for new users')
            
            user = db.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
        
        db.commit()

        return jsonify({
            "message": "Login successful",
            "user": dict(user),
            "is_admin": bool(user["is_admin"])
        })

    except ValueError as e:
        logger.error(f"Invalid token: {e}")
        return jsonify({"message": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"Google Auth Error: {e}", exc_info=True)
        return jsonify({"message": "An error occurred during authentication"}), 500

# User Settings (Enhanced)
@app.route('/api/user/settings', methods=['GET', 'POST'])
def handle_user_settings():
    db = get_db()
    if request.method == "GET":
        user_id = request.args.get("userId")
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        settings = db.execute("SELECT settings FROM users WHERE user_id = ?", (user_id,)).fetchone()
        return jsonify(json.loads(settings["settings"] if settings and settings["settings"] else "{}"))
    else:  # POST
        data = request.get_json()
        user_id = data.get("userId")
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        settings_json = json.dumps(data.get("settings", {}))
        db.execute("UPDATE users SET settings = ? WHERE user_id = ?", (settings_json, user_id))
        db.commit()
        return jsonify({"message": "Settings saved"})

# Enhanced Services
@app.route('/api/services', methods=['GET'])
def get_services():
    category = request.args.get('category', 'all')
    db = get_db()
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    if category == 'all':
        services = db.execute("SELECT * FROM services WHERE is_active = 1 ORDER BY category, service_id").fetchall()
    else:
        services = db.execute("SELECT * FROM services WHERE is_active = 1 AND category = ? ORDER BY service_id", (category,)).fetchall()
    
    return jsonify([dict(s) for s in services])

# Orders Management
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    user_id = data.get('user_id')
    service_id = data.get('service_id')
    payment_method = data.get('payment_method', 'usd')
    order_details = data.get('order_details', '')
    payment_data = data.get('payment_data', {})
    
    if not user_id or not service_id:
        return jsonify({"error": "User ID and Service ID required"}), 400
    
    db = get_db()
    
    # Check if user is banned
    user = db.execute("SELECT is_banned, ban_reason, coins FROM users WHERE user_id = ?", (user_id,)).fetchone()
    if user['is_banned']:
        return jsonify({"error": f"Account banned: {user['ban_reason'] or 'No reason provided'}"}), 403
    
    # Get service details
    service = db.execute("SELECT * FROM services WHERE service_id = ? AND is_active = 1", (service_id,)).fetchone()
    if not service:
        return jsonify({"error": "Service not found"}), 404
    
    # Calculate price based on payment method
    if payment_method == 'coins':
        if user['coins'] < service['price_coins']:
            return jsonify({"error": "Insufficient coins"}), 400
        price_paid = 0
        coins_paid = service['price_coins']
        # Deduct coins
        db.execute("UPDATE users SET coins = coins - ? WHERE user_id = ?", (coins_paid, user_id))
    else:
        price_paid = service[f'price_{payment_method}']
        coins_paid = 0
    
    # Create order
    cursor = db.execute("""
        INSERT INTO orders (user_id, service_id, payment_method, price_paid, coins_paid, order_details)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, service_id, payment_method, price_paid, coins_paid, order_details))
    
    order_id = cursor.lastrowid
    
    # Add coin transaction if coins were used
    if payment_method == 'coins':
        add_coins_to_user(user_id, -coins_paid, 'spend', f'Order #{order_id}: {service["name"]}', order_id)
    
    # Generate receipt
    receipt_id = generate_receipt_id()
    receipt_data = {
        'receipt_id': receipt_id,
        'order_id': order_id,
        'service_name': service['name'],
        'service_description': service['description'],
        'payment_method': payment_method,
        'price_paid': price_paid,
        'coins_paid': coins_paid,
        'creation_date': datetime.now().isoformat(),
        'user_info': {
            'user_id': user_id,
            'email': user.get('email', ''),
            'name': f"{user.get('first_name', '')} {user.get('last_name', '')}"
        }
    }
    
    db.execute("""
        INSERT INTO receipts (receipt_id, order_id, user_id, receipt_data)
        VALUES (?, ?, ?, ?)
    """, (receipt_id, order_id, user_id, json.dumps(receipt_data)))
    
    db.commit()
    
    return jsonify({
        "message": "Order created successfully",
        "order_id": order_id,
        "receipt_id": receipt_id,
        "serviceName": service['name'],
        "payment_method": payment_method,
        "priceUsd": service['price_usd'],
        "priceEur": service['price_eur'],
        "priceUah": service['price_uah'],
        "priceCoins": service['price_coins']
    })

@app.route('/api/orders/user/<int:user_id>', methods=['GET'])
def get_user_orders(user_id):
    db = get_db()
    orders = db.execute("""
        SELECT o.*, s.name as service_name, s.category
        FROM orders o
        JOIN services s ON o.service_id = s.service_id
        WHERE o.user_id = ?
        ORDER BY o.creation_date DESC
    """, (user_id,)).fetchall()
    
    return jsonify([dict(o) for o in orders])

# Receipt Management
@app.route('/api/receipts/<receipt_id>', methods=['GET'])
def get_receipt(receipt_id):
    db = get_db()
    receipt = db.execute("""
        SELECT * FROM receipts WHERE receipt_id = ?
    """, (receipt_id,)).fetchone()
    
    if not receipt:
        return jsonify({"error": "Receipt not found"}), 404
    
    return jsonify({
        "receipt_id": receipt['receipt_id'],
        "receipt_data": json.loads(receipt['receipt_data'])
    })

# Support Tickets
@app.route('/api/support/tickets', methods=['POST'])
def create_support_ticket():
    data = request.get_json()
    user_id = data.get('user_id')
    category = data.get('category')
    subject = data.get('subject', '')
    message = data.get('message')
    
    if not user_id or not category or not message:
        return jsonify({"error": "Missing required fields"}), 400
    
    db = get_db()
    cursor = db.execute("""
        INSERT INTO support_tickets (user_id, category, subject, message)
        VALUES (?, ?, ?, ?)
    """, (user_id, category, subject, message))
    
    ticket_id = cursor.lastrowid
    db.commit()
    
    return jsonify({
        "message": "Support ticket created successfully",
        "ticket_id": ticket_id
    })

@app.route('/api/support/tickets/user/<int:user_id>', methods=['GET'])
def get_user_support_tickets(user_id):
    db = get_db()
    tickets = db.execute("""
        SELECT * FROM support_tickets
        WHERE user_id = ?
        ORDER BY creation_date DESC
    """, (user_id,)).fetchall()
    
    return jsonify([dict(t) for t in tickets])

# Coins Management
@app.route('/api/coins/purchase', methods=['POST'])
def purchase_coins():
    data = request.get_json()
    user_id = data.get('user_id')
    amount_usd = data.get('amount_usd')
    
    if not user_id or not amount_usd:
        return jsonify({"error": "User ID and amount required"}), 400
    
    # Calculate coins (1 USD = 10 coins)
    coins_to_add = int(amount_usd * 10)
    
    # In a real implementation, you would process payment here
    # For demo, we'll just add the coins
    add_coins_to_user(user_id, coins_to_add, 'purchase', f'Purchased {coins_to_add} coins for ${amount_usd}')
    
    return jsonify({
        "message": f"Successfully purchased {coins_to_add} coins",
        "coins_added": coins_to_add
    })

@app.route('/api/user/<int:user_id>/coins', methods=['GET'])
def get_user_coins(user_id):
    db = get_db()
    user = db.execute("SELECT coins FROM users WHERE user_id = ?", (user_id,)).fetchone()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({"coins": user['coins']})

@app.route('/api/coins/transactions/<int:user_id>', methods=['GET'])
def get_coin_transactions(user_id):
    db = get_db()
    transactions = db.execute("""
        SELECT * FROM coin_transactions
        WHERE user_id = ?
        ORDER BY creation_date DESC
        LIMIT 50
    """, (user_id,)).fetchall()
    
    return jsonify([dict(t) for t in transactions])

# Donations
@app.route('/api/donations', methods=['POST'])
def create_donation():
    data = request.get_json()
    user_id = data.get('user_id')
    amount_usd = data.get('amount_usd')
    message = data.get('message', '')
    is_anonymous = data.get('is_anonymous', False)
    
    if not amount_usd or amount_usd <= 0:
        return jsonify({"error": "Valid amount required"}), 400
    
    db = get_db()
    db.execute("""
        INSERT INTO donations (user_id, amount_usd, message, is_anonymous)
        VALUES (?, ?, ?, ?)
    """, (user_id, amount_usd, message, is_anonymous))
    db.commit()
    
    # Give bonus coins for donations (1 USD = 5 bonus coins)
    if user_id:
        bonus_coins = int(amount_usd * 5)
        add_coins_to_user(user_id, bonus_coins, 'bonus', f'Donation bonus: {bonus_coins} coins for ${amount_usd} donation')
    
    return jsonify({"message": "Thank you for your donation!"})

@app.route('/api/donations', methods=['GET'])
def get_donations():
    db = get_db()
    donations = db.execute("""
        SELECT d.*, u.first_name, u.last_name
        FROM donations d
        LEFT JOIN users u ON d.user_id = u.user_id
        ORDER BY d.creation_date DESC
        LIMIT 20
    """, ).fetchall()
    
    result = []
    for d in donations:
        donation = dict(d)
        if donation['is_anonymous']:
            donation['first_name'] = 'Anonymous'
            donation['last_name'] = ''
        result.append(donation)
    
    return jsonify(result)

# News Management
@app.route('/api/news', methods=['GET'])
def get_news():
    db = get_db()
    news = db.execute("""
        SELECT * FROM news
        WHERE is_published = 1
        ORDER BY priority DESC, creation_date DESC
        LIMIT 10
    """).fetchall()
    
    return jsonify([dict(n) for n in news])

# Reviews (Enhanced)
@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    service_id = request.args.get("serviceId")
    if not service_id:
        return jsonify([])
    
    db = get_db()
    if not db:
        return jsonify([])
        
    reviews = db.execute("""
        SELECT r.*, u.first_name FROM reviews r 
        JOIN users u ON r.user_id = u.user_id
        WHERE r.service_id = ? AND r.is_approved = 1 ORDER BY r.creation_date DESC
    """, (service_id,)).fetchall()
    return jsonify([dict(r) for r in reviews])

@app.route('/api/reviews', methods=['POST'])
def create_review():
    data = request.get_json()
    user_id = data.get('user_id')
    service_id = data.get('service_id')
    order_id = data.get('order_id')
    rating = data.get('rating')
    review_text = data.get('review_text', '')
    
    if not all([user_id, service_id, rating]) or rating < 1 or rating > 5:
        return jsonify({"error": "Invalid review data"}), 400
    
    db = get_db()
    
    # Check if user has completed order for this service
    if order_id:
        order = db.execute("""
            SELECT * FROM orders 
            WHERE order_id = ? AND user_id = ? AND service_id = ? AND status = 'completed'
        """, (order_id, user_id, service_id)).fetchone()
        
        if not order:
            return jsonify({"error": "Can only review completed orders"}), 400
    
    db.execute("""
        INSERT INTO reviews (user_id, service_id, order_id, rating, review_text)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, service_id, order_id, rating, review_text))
    db.commit()
    
    return jsonify({"message": "Review submitted for approval"})

# Admin Login with 2FA
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    two_fa_code = data.get('two_fa_code')
    
    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400
    
    db = get_db()
    admin = db.execute("SELECT * FROM admins WHERE username = ?", (username,)).fetchone()
    
    if not admin or not check_password_hash(admin['password_hash'], password):
        return jsonify({"message": "Invalid credentials"}), 401
    
    # Check 2FA if enabled
    if admin['is_2fa_enabled']:
        if not two_fa_code:
            # Send 2FA code
            code = generate_2fa_code()
            expires_at = (datetime.now() + timedelta(minutes=5)).isoformat()
            
            db.execute("""
                INSERT INTO two_fa_codes (admin_id, code, expires_at)
                VALUES (?, ?, ?)
            """, (admin['id'], code, expires_at))
            db.commit()
            
            send_sms_code(admin['phone'], code)
            
            return jsonify({
                "message": "2FA code sent to your phone",
                "requires_2fa": True,
                "admin_id": admin['id']
            })
        else:
            # Verify 2FA code
            valid_code = db.execute("""
                SELECT * FROM two_fa_codes
                WHERE admin_id = ? AND code = ? AND is_used = 0 AND expires_at > ?
                ORDER BY creation_date DESC LIMIT 1
            """, (admin['id'], two_fa_code, datetime.now().isoformat())).fetchone()
            
            if not valid_code:
                return jsonify({"message": "Invalid or expired 2FA code"}), 401
            
            # Mark code as used
            db.execute("UPDATE two_fa_codes SET is_used = 1 WHERE id = ?", (valid_code['id'],))
            db.commit()
    
    # Try to find corresponding user
    user_as_admin = db.execute("SELECT * FROM users WHERE email = ?", (username,)).fetchone()
    
    session['admin_id'] = admin['id']
    
    return jsonify({
        "message": "Admin login successful", 
        "user": dict(user_as_admin) if user_as_admin else {"first_name": "Admin", "user_id": -1},
        "admin_id": admin['id']
    })

# Enable 2FA
@app.route('/api/admin/enable-2fa', methods=['POST'])
def enable_2fa():
    data = request.get_json()
    admin_id = data.get('admin_id')
    phone = data.get('phone')
    
    if not admin_id or not phone:
        return jsonify({"error": "Admin ID and phone required"}), 400
    
    db = get_db()
    db.execute("""
        UPDATE admins SET phone = ?, is_2fa_enabled = 1
        WHERE id = ?
    """, (phone, admin_id))
    db.commit()
    
    return jsonify({"message": "2FA enabled successfully"})

# Admin Stats (Enhanced)
@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    db = get_db()
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    # Basic stats
    total_users = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    banned_users = db.execute("SELECT COUNT(*) FROM users WHERE is_banned = 1").fetchone()[0]
    total_orders = db.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    pending_orders = db.execute("SELECT COUNT(*) FROM orders WHERE status = 'pending'").fetchone()[0]
    completed_orders = db.execute("SELECT COUNT(*) FROM orders WHERE status = 'completed'").fetchone()[0]
    total_revenue = db.execute("SELECT SUM(price_paid) FROM orders WHERE status = 'completed'").fetchone()[0] or 0
    total_coins_purchased = db.execute("SELECT SUM(amount) FROM coin_transactions WHERE transaction_type = 'purchase'").fetchone()[0] or 0
    total_donations = db.execute("SELECT SUM(amount_usd) FROM donations").fetchone()[0] or 0
    open_support_tickets = db.execute("SELECT COUNT(*) FROM support_tickets WHERE status = 'open'").fetchone()[0]
    
    # Recent activity
    recent_orders = db.execute("""
        SELECT o.order_id, o.status, o.creation_date, u.first_name, s.name as service_name
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        JOIN services s ON o.service_id = s.service_id
        ORDER BY o.creation_date DESC LIMIT 5
    """).fetchall()
    
    # Service popularity
    popular_services = db.execute("""
        SELECT s.name, COUNT(o.order_id) as order_count
        FROM services s
        LEFT JOIN orders o ON s.service_id = o.service_id
        GROUP BY s.service_id, s.name
        ORDER BY order_count DESC LIMIT 5
    """).fetchall()
    
    stats = {
        "total_users": total_users,
        "banned_users": banned_users,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "total_revenue": round(total_revenue, 2),
        "total_coins_purchased": total_coins_purchased,
        "total_donations": round(total_donations, 2),
        "open_support_tickets": open_support_tickets,
        "recent_orders": [dict(o) for o in recent_orders],
        "popular_services": [dict(s) for s in popular_services]
    }
    
    return jsonify(stats)

# Admin Users Management
@app.route('/api/admin/users', methods=['GET'])
def get_admin_users():
    user_type = request.args.get('type', 'all')
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    db = get_db()
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    query = "SELECT * FROM users WHERE 1=1"
    params = []
    
    if user_type == 'google':
        query += " AND google_id IS NOT NULL"
    elif user_type == 'telegram':
        query += " AND telegram_id IS NOT NULL"
    elif user_type == 'banned':
        query += " AND is_banned = 1"
    
    if search:
        query += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR user_id = ?)"
        search_param = f"%{search}%"
        params.extend([search_param, search_param, search_param, search if search.isdigit() else 0])
    
    query += " ORDER BY creation_date DESC LIMIT ? OFFSET ?"
    params.extend([per_page, (page - 1) * per_page])
    
    users = db.execute(query, params).fetchall()
    
    return jsonify([dict(u) for u in users])

# Ban/Unban User
@app.route('/api/admin/users/<int:user_id>/ban', methods=['POST'])
def ban_user(user_id):
    data = request.get_json()
    ban_reason = data.get('ban_reason', 'No reason provided')
    
    db = get_db()
    db.execute("""
        UPDATE users SET is_banned = 1, ban_reason = ?
        WHERE user_id = ?
    """, (ban_reason, user_id))
    db.commit()
    
    return jsonify({"message": "User banned successfully"})

@app.route('/api/admin/users/<int:user_id>/unban', methods=['POST'])
def unban_user(user_id):
    db = get_db()
    db.execute("""
        UPDATE users SET is_banned = 0, ban_reason = NULL
        WHERE user_id = ?
    """, (user_id,))
    db.commit()
    
    return jsonify({"message": "User unbanned successfully"})

# Admin Orders Management (Enhanced)
@app.route('/api/admin/orders', methods=['GET'])
def get_admin_orders():
    status = request.args.get('status', 'all')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    db = get_db()
    
    query = """
        SELECT o.*, u.first_name, u.last_name, u.email, s.name as service_name, s.description as service_description
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        JOIN services s ON o.service_id = s.service_id
    """
    params = []
    
    if status != 'all':
        query += " WHERE o.status = ?"
        params.append(status)
    
    query += " ORDER BY o.creation_date DESC LIMIT ? OFFSET ?"
    params.extend([per_page, (page - 1) * per_page])
    
    orders = db.execute(query, params).fetchall()
    
    return jsonify([dict(o) for o in orders])

# Approve/Reject Payment
@app.route('/api/admin/orders/<int:order_id>/approve', methods=['POST'])
def approve_payment(order_id):
    db = get_db()
    
    # Update order status to completed
    db.execute("""
        UPDATE orders SET status = 'completed', completion_date = CURRENT_TIMESTAMP
        WHERE order_id = ?
    """, (order_id,))
    db.commit()
    
    return jsonify({"message": "Payment approved and order completed"})

@app.route('/api/admin/orders/<int:order_id>/reject', methods=['POST'])
def reject_payment(order_id):
    data = request.get_json()
    reason = data.get('reason', 'Payment rejected by admin')
    
    db = get_db()
    
    # Update order status to cancelled
    db.execute("""
        UPDATE orders SET status = 'cancelled', admin_notes = ?
        WHERE order_id = ?
    """, (reason, order_id))
    db.commit()
    
    return jsonify({"message": "Payment rejected"})

# Update Order Status
@app.route('/api/admin/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    data = request.get_json()
    status = data.get('status')
    admin_notes = data.get('admin_notes', '')
    
    if status not in ['pending', 'in_progress', 'completed', 'cancelled', 'refunded']:
        return jsonify({"error": "Invalid status"}), 400
    
    db = get_db()
    
    # Get order details for refund processing
    order = db.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,)).fetchone()
    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    # Update order
    update_data = [status, admin_notes, order_id]
    query = "UPDATE orders SET status = ?, admin_notes = ?"
    
    if status == 'completed':
        query += ", completion_date = CURRENT_TIMESTAMP"
    elif status == 'refunded' and order['coins_paid'] > 0:
        # Refund coins
        add_coins_to_user(order['user_id'], order['coins_paid'], 'refund', f'Refund for order #{order_id}', order_id)
    
    query += " WHERE order_id = ?"
    
    db.execute(query, update_data)
    db.commit()
    
    return jsonify({"message": "Order status updated successfully"})

# Admin News Management
@app.route('/api/admin/news', methods=['GET'])
def get_admin_news():
    db = get_db()
    news = db.execute("""
        SELECT n.*, a.username as author_name
        FROM news n
        LEFT JOIN admins a ON n.author_id = a.id
        ORDER BY n.creation_date DESC
    """).fetchall()
    
    return jsonify([dict(n) for n in news])

@app.route('/api/admin/news', methods=['POST'])
def create_news():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    priority = data.get('priority', 0)
    is_published = data.get('is_published', True)
    author_id = session.get('admin_id', 1)
    
    if not title or not content:
        return jsonify({"error": "Title and content required"}), 400
    
    db = get_db()
    db.execute("""
        INSERT INTO news (title, content, author_id, priority, is_published)
        VALUES (?, ?, ?, ?, ?)
    """, (title, content, author_id, priority, is_published))
    db.commit()
    
    return jsonify({"message": "News created successfully"})

@app.route('/api/admin/news/<int:news_id>', methods=['PUT'])
def update_news(news_id):
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    priority = data.get('priority', 0)
    is_published = data.get('is_published', True)
    
    db = get_db()
    db.execute("""
        UPDATE news SET title = ?, content = ?, priority = ?, is_published = ?
        WHERE news_id = ?
    """, (title, content, priority, is_published, news_id))
    db.commit()
    
    return jsonify({"message": "News updated successfully"})

@app.route('/api/admin/news/<int:news_id>', methods=['DELETE'])
def delete_news(news_id):
    db = get_db()
    db.execute("DELETE FROM news WHERE news_id = ?", (news_id,))
    db.commit()
    
    return jsonify({"message": "News deleted successfully"})

# Admin Support Tickets Management
@app.route('/api/admin/support/tickets', methods=['GET'])
def get_admin_support_tickets():
    status = request.args.get('status', 'all')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    db = get_db()
    
    query = """
        SELECT st.*, u.first_name, u.last_name, u.email
        FROM support_tickets st
        JOIN users u ON st.user_id = u.user_id
    """
    params = []
    
    if status != 'all':
        query += " WHERE st.status = ?"
        params.append(status)
    
    query += " ORDER BY st.creation_date DESC LIMIT ? OFFSET ?"
    params.extend([per_page, (page - 1) * per_page])
    
    tickets = db.execute(query, params).fetchall()
    
    return jsonify([dict(t) for t in tickets])

@app.route('/api/admin/support/tickets/<int:ticket_id>/respond', methods=['POST'])
def respond_to_support_ticket(ticket_id):
    data = request.get_json()
    response_text = data.get('response')
    new_status = data.get('status', 'resolved')
    
    if not response_text:
        return jsonify({"error": "Response text required"}), 400
    
    db = get_db()
    db.execute("""
        UPDATE support_tickets 
        SET admin_response = ?, status = ?, updated_date = CURRENT_TIMESTAMP
        WHERE ticket_id = ?
    """, (response_text, new_status, ticket_id))
    db.commit()
    
    return jsonify({"message": "Response sent successfully"})

# Health check for Render
@app.route('/health', methods=['GET'])
def health_check():
    """Enhanced health check with system status"""
    try:
        # Check database
        db = get_db()
        db_status = "healthy" if db else "unhealthy"
        
        # Check bot status
        bot_status = "online" if check_bot_process() else "offline"
        
        # Update status file
        update_bot_status()
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "uptime_seconds": int(time.time() - START_TIME),
            "database": db_status,
            "bot_status": bot_status,
            "version": "1.0.0"
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

# Bot management endpoints
@app.route('/api/bot/start', methods=['POST'])
def start_bot():
    """Manually start the bot process"""
    try:
        if check_bot_process():
            return jsonify({"message": "Bot is already running"}), 200
        
        start_bot_if_needed()
        return jsonify({"message": "Bot start initiated"}), 200
    except Exception as e:
        logger.error(f"Failed to start bot: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/bot/status', methods=['GET'])
def bot_status():
    """Get detailed bot status"""
    try:
        is_running = check_bot_process()
        status_file_exists = os.path.exists(BOT_STATUS_FILE)
        
        if status_file_exists:
            status_file_age = time.time() - os.path.getmtime(BOT_STATUS_FILE)
        else:
            status_file_age = None
        
        return jsonify({
            "is_running": is_running,
            "status_file_exists": status_file_exists,
            "status_file_age_seconds": status_file_age,
            "last_check": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Failed to get bot status: {e}")
        return jsonify({"error": str(e)}), 500

# --- SPA Serving ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    """Serve static files and SPA"""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

# --- Startup Tasks ---
def startup_tasks():
    """Run startup tasks"""
    logger.info("🚀 Running startup tasks...")
    
    # Create necessary directories
    os.makedirs('logs', exist_ok=True)
    
    # Setup database
    setup_database()
    
    # Start bot if needed (only in production)
    if os.getenv('RENDER') or os.getenv('HEROKU'):
        threading.Timer(5.0, start_bot_if_needed).start()
    
    logger.info("✅ Startup tasks completed")

# --- Signal Handlers ---
def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"📡 Received signal {signum}, shutting down gracefully...")
    sys.exit(0)

# --- Main ---
if __name__ == "__main__":
    # Setup signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    # Run startup tasks
    startup_tasks()
    
    logger.info(f"🌐 Server starting on port {PORT}")
    logger.info(f"🏠 Environment: {'Production' if os.getenv('RENDER') or os.getenv('HEROKU') else 'Development'}")
    
    try:
        app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)
    except Exception as e:
        logger.error(f"❌ Server failed to start: {e}")
        sys.exit(1)