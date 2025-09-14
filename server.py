#!/usr/bin/env python3
"""
Phantom Services - Flask Server
Professional IT Services Platform
"""

import os
import sys
import time
import json
import sqlite3
import hashlib
import secrets
import logging
import threading
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

import requests
from flask import Flask, request, jsonify, send_from_directory, g, render_template_string
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/server.log') if os.path.exists('logs') else logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Flask app configuration
app = Flask(__name__, static_folder='static', static_url_path='/static')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'phantom-services-secret-key-2025')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# CORS configuration
CORS(app, origins=['*'])

# Constants
DATABASE_FILE = 'phantom_services.db'
UPLOADS_FOLDER = 'uploads'
GOOGLE_CLIENT_ID = '957687109285-gs24ojtjhjkatpi7n0rrpb1c57tf95e2.apps.googleusercontent.com'
ADMIN_EMAILS = ['admin_phantom2000@phantom.com', 'aishchnko12@gmail.com']

# Crypto wallet addresses
CRYPTO_WALLETS = {
    'uah': '4149 6090 1876 9549',  # PrivatBank card
    'ton': 'UQCKtm0RoDtPCyObq18G-FKehsDPaVIiVX5Z8q78P_XfmTUh',
    'usdt': 'TYourUSDTAddressHere'  # Replace with your USDT TRC20 address
}

# Ensure directories exist
os.makedirs('logs', exist_ok=True)
os.makedirs(UPLOADS_FOLDER, exist_ok=True)
os.makedirs('static/images', exist_ok=True)

# Database setup
def get_db():
    """Get database connection"""
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE_FILE)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """Close database connection"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.teardown_appcontext
def close_db(error=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_database():
    """Initialize database with tables"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            country TEXT,
            password_hash TEXT,
            google_id TEXT,
            avatar_url TEXT,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Services table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS services (
            service_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            duration TEXT,
            icon TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Programs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS programs (
            program_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            language TEXT,
            version TEXT DEFAULT '1.0',
            icon TEXT,
            file_path TEXT,
            download_count INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # News table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS news (
            news_id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id INTEGER,
            is_published BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users (user_id)
        )
    ''')
    
    # Orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            service_id INTEGER NOT NULL,
            comments TEXT,
            price DECIMAL(10,2) NOT NULL,
            payment_method TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            payment_proof_path TEXT,
            admin_comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id),
            FOREIGN KEY (service_id) REFERENCES services (service_id)
        )
    ''')
    
    # Chat messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            message_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            is_admin_reply BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    # Downloads table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS downloads (
            download_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            program_id INTEGER NOT NULL,
            download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id),
            FOREIGN KEY (program_id) REFERENCES programs (program_id)
        )
    ''')
    
    # Insert default data
    cursor.execute('SELECT COUNT(*) FROM services')
    if cursor.fetchone()[0] == 0:
        default_services = [
            ('Разблокировка загрузчика', 'Разблокировка bootloader для Android устройств', 500.00, '1-2 дня', 'fas fa-unlock'),
            ('Установка root-прав', 'Получение root доступа на Android устройствах', 300.00, '1 день', 'fas fa-user-shield'),
            ('Прошивка устройств', 'Установка кастомных прошивок и восстановление', 800.00, '2-3 дня', 'fas fa-microchip'),
            ('Установка ОС (ПК)', 'Установка Windows, Linux и настройка системы', 400.00, '1 день', 'fas fa-desktop'),
            ('Удаление вирусов', 'Полная очистка от вирусов и вредоносного ПО', 350.00, '1 день', 'fas fa-shield-virus'),
            ('Настройка сети', 'Настройка роутеров, Wi-Fi и сетевого оборудования', 450.00, '1-2 дня', 'fas fa-network-wired')
        ]
        
        cursor.executemany('''
            INSERT INTO services (name, description, price, duration, icon)
            VALUES (?, ?, ?, ?, ?)
        ''', default_services)
    
    # Create admin users if not exist
    for email in ADMIN_EMAILS:
        cursor.execute('SELECT COUNT(*) FROM users WHERE email = ?', (email,))
        if cursor.fetchone()[0] == 0:
            admin_id = generate_id(8)
            password_hash = generate_password_hash('phandmin2000_pwd' if 'phantom' in email else 'admin123')
            cursor.execute('''
                INSERT INTO users (user_id, name, email, password_hash, is_admin)
                VALUES (?, ?, ?, ?, ?)
            ''', (admin_id, 'Admin', email, password_hash, True))
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# Utility functions
def generate_id(length):
    """Generate random numeric ID"""
    return int(''.join([str(secrets.randbelow(10)) for _ in range(length)]))

def generate_filename(user_name, service_name, file_extension):
    """Generate unique filename for uploads"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = generate_id(8)
    safe_user = secure_filename(user_name.replace(' ', '_'))
    safe_service = secure_filename(service_name.replace(' ', '_'))
    return f"{safe_user}_{timestamp}_{safe_service}_{unique_id}.{file_extension}"

# JWT token functions
def generate_token(user_id):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Authentication decorator
def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token required'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid token'}), 401
        
        g.current_user_id = user_id
        return f(*args, **kwargs)
    
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'current_user_id'):
            return jsonify({'error': 'Authentication required'}), 401
        
        db = get_db()
        user = db.execute(
            'SELECT is_admin, email FROM users WHERE user_id = ?',
            (g.current_user_id,)
        ).fetchone()
        
        if not user or (not user['is_admin'] and user['email'] not in ADMIN_EMAILS):
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

# Routes
@app.route('/')
def index():
    """Serve main page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_spa(path):
    """Serve SPA for all routes"""
    # Check if it's a static file
    if path.startswith('static/') or '.' in path:
        try:
            return send_from_directory('.', path)
        except:
            return send_from_directory('.', 'index.html')
    
    # Serve main page for SPA routes
    return send_from_directory('.', 'index.html')

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Phantom Services',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0'
    })

@app.route('/api/status')
def system_status():
    """System status endpoint"""
    try:
        db = get_db()
        user_count = db.execute('SELECT COUNT(*) as count FROM users').fetchone()['count']
        order_count = db.execute('SELECT COUNT(*) as count FROM orders').fetchone()['count']
        
        return jsonify({
            'status': 'online',
            'users': user_count,
            'orders': order_count,
            'uptime': time.time(),
            'crypto_wallets': CRYPTO_WALLETS
        })
    except Exception as e:
        logger.error(f"Status check error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password', 'country']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if email already exists
        db = get_db()
        existing_user = db.execute(
            'SELECT user_id FROM users WHERE email = ?',
            (data['email'],)
        ).fetchone()
        
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user_id = generate_id(8)
        password_hash = generate_password_hash(data['password'])
        is_admin = data['email'] in ADMIN_EMAILS
        
        db.execute('''
            INSERT INTO users (user_id, name, email, phone, country, password_hash, is_admin)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, data['name'], data['email'], data.get('phone'), data['country'], password_hash, is_admin))
        
        db.commit()
        
        # Generate token
        token = generate_token(user_id)
        
        # Get user data
        user = db.execute(
            'SELECT user_id, name, email, phone, country, is_admin, avatar_url, created_at FROM users WHERE user_id = ?',
            (user_id,)
        ).fetchone()
        
        user_data = dict(user)
        user_data['orders_count'] = 0
        
        return jsonify({
            'token': token,
            'user': user_data
        })
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        db = get_db()
        user = db.execute(
            'SELECT * FROM users WHERE email = ?',
            (email,)
        ).fetchone()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update admin status if needed
        is_admin = email in ADMIN_EMAILS
        if is_admin != user['is_admin']:
            db.execute(
                'UPDATE users SET is_admin = ? WHERE user_id = ?',
                (is_admin, user['user_id'])
            )
            db.commit()
        
        # Generate token
        token = generate_token(user['user_id'])
        
        # Update last login
        db.execute(
            'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            (user['user_id'],)
        )
        db.commit()
        
        # Get orders count
        orders_count = db.execute(
            'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
            (user['user_id'],)
        ).fetchone()['count']
        
        user_data = dict(user)
        user_data['orders_count'] = orders_count
        user_data['is_admin'] = is_admin
        del user_data['password_hash']  # Remove sensitive data
        
        return jsonify({
            'token': token,
            'user': user_data
        })
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/google', methods=['POST'])
def google_login():
    """Google OAuth login"""
    try:
        data = request.get_json()
        credential = data.get('credential')
        
        if not credential:
            return jsonify({'error': 'Google credential required'}), 400
        
        # Verify Google token
        try:
            idinfo = id_token.verify_oauth2_token(
                credential, google_requests.Request(), GOOGLE_CLIENT_ID
            )
            
            google_id = idinfo['sub']
            email = idinfo['email']
            name = idinfo['name']
            avatar_url = idinfo.get('picture')
            
        except ValueError as e:
            logger.error(f"Google token verification failed: {e}")
            return jsonify({'error': 'Invalid Google token'}), 400
        
        db = get_db()
        
        # Check if user exists
        user = db.execute(
            'SELECT * FROM users WHERE email = ? OR google_id = ?',
            (email, google_id)
        ).fetchone()
        
        is_admin = email in ADMIN_EMAILS
        
        if user:
            # Update existing user
            db.execute('''
                UPDATE users SET google_id = ?, avatar_url = ?, is_admin = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            ''', (google_id, avatar_url, is_admin, user['user_id']))
            user_id = user['user_id']
        else:
            # Create new user
            user_id = generate_id(8)
            db.execute('''
                INSERT INTO users (user_id, name, email, google_id, avatar_url, is_admin)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, name, email, google_id, avatar_url, is_admin))
        
        db.commit()
        
        # Generate token
        token = generate_token(user_id)
        
        # Get updated user data
        user = db.execute(
            'SELECT user_id, name, email, phone, country, avatar_url, is_admin, created_at FROM users WHERE user_id = ?',
            (user_id,)
        ).fetchone()
        
        # Get orders count
        orders_count = db.execute(
            'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
            (user_id,)
        ).fetchone()['count']
        
        user_data = dict(user)
        user_data['orders_count'] = orders_count
        
        return jsonify({
            'token': token,
            'user': user_data
        })
        
    except Exception as e:
        logger.error(f"Google login error: {e}")
        return jsonify({'error': 'Google login failed'}), 500

@app.route('/api/auth/me', methods=['GET'])
@auth_required
def get_current_user():
    """Get current user info"""
    try:
        db = get_db()
        user = db.execute(
            'SELECT user_id, name, email, phone, country, avatar_url, is_admin, created_at FROM users WHERE user_id = ?',
            (g.current_user_id,)
        ).fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check admin status
        is_admin = user['email'] in ADMIN_EMAILS if user['email'] else user['is_admin']
        
        # Get orders count
        orders_count = db.execute(
            'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
            (g.current_user_id,)
        ).fetchone()['count']
        
        user_data = dict(user)
        user_data['orders_count'] = orders_count
        user_data['is_admin'] = is_admin
        
        return jsonify(user_data)
        
    except Exception as e:
        logger.error(f"Get current user error: {e}")
        return jsonify({'error': 'Failed to get user info'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@auth_required
def logout():
    """User logout"""
    return jsonify({'message': 'Logged out successfully'})

# Services routes
@app.route('/api/services', methods=['GET'])
def get_services():
    """Get all active services"""
    try:
        db = get_db()
        services = db.execute(
            'SELECT * FROM services WHERE is_active = TRUE ORDER BY service_id'
        ).fetchall()
        
        return jsonify([dict(service) for service in services])
        
    except Exception as e:
        logger.error(f"Get services error: {e}")
        return jsonify({'error': 'Failed to get services'}), 500

# Programs routes
@app.route('/api/programs', methods=['GET'])
def get_programs():
    """Get all active programs"""
    try:
        db = get_db()
        programs = db.execute(
            'SELECT * FROM programs WHERE is_active = TRUE ORDER BY program_id'
        ).fetchall()
        
        return jsonify([dict(program) for program in programs])
        
    except Exception as e:
        logger.error(f"Get programs error: {e}")
        return jsonify({'error': 'Failed to get programs'}), 500

# News routes
@app.route('/api/news', methods=['GET'])
def get_news():
    """Get all published news"""
    try:
        db = get_db()
        news = db.execute('''
            SELECT n.*, u.name as author_name
            FROM news n
            LEFT JOIN users u ON n.author_id = u.user_id
            WHERE n.is_published = TRUE
            ORDER BY n.created_at DESC
        ''').fetchall()
        
        return jsonify([dict(item) for item in news])
        
    except Exception as e:
        logger.error(f"Get news error: {e}")
        return jsonify({'error': 'Failed to get news'}), 500

# Orders routes
@app.route('/api/orders', methods=['POST'])
@auth_required
def create_order():
    """Create new order"""
    try:
        service_id = request.form.get('service_id')
        comments = request.form.get('comments', '')
        payment_method = request.form.get('payment_method')
        
        if not service_id or not payment_method:
            return jsonify({'error': 'Service ID and payment method required'}), 400
        
        # Get service info
        db = get_db()
        service = db.execute(
            'SELECT * FROM services WHERE service_id = ? AND is_active = TRUE',
            (service_id,)
        ).fetchone()
        
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        # Get user info
        user = db.execute(
            'SELECT * FROM users WHERE user_id = ?',
            (g.current_user_id,)
        ).fetchone()
        
        # Handle file upload
        payment_proof_path = None
        if 'payment_proof' in request.files:
            file = request.files['payment_proof']
            if file and file.filename:
                filename = generate_filename(
                    user['name'],
                    service['name'],
                    file.filename.rsplit('.', 1)[1].lower()
                )
                file_path = os.path.join(UPLOADS_FOLDER, filename)
                file.save(file_path)
                payment_proof_path = filename
        
        # Create order
        order_id = generate_id(6)
        
        db.execute('''
            INSERT INTO orders (order_id, user_id, service_id, comments, price, payment_method, payment_proof_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (order_id, g.current_user_id, service_id, comments, service['price'], payment_method, payment_proof_path))
        
        db.commit()
        
        return jsonify({
            'order_id': order_id,
            'message': 'Order created successfully',
            'receipt_data': {
                'order_id': order_id,
                'user_name': user['name'],
                'user_email': user['email'],
                'service_name': service['name'],
                'price': service['price'],
                'payment_method': payment_method
            }
        })
        
    except Exception as e:
        logger.error(f"Create order error: {e}")
        return jsonify({'error': 'Failed to create order'}), 500

@app.route('/api/orders', methods=['GET'])
@auth_required
def get_user_orders():
    """Get user's orders"""
    try:
        db = get_db()
        orders = db.execute('''
            SELECT o.*, s.name as service_name
            FROM orders o
            JOIN services s ON o.service_id = s.service_id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        ''', (g.current_user_id,)).fetchall()
        
        return jsonify([dict(order) for order in orders])
        
    except Exception as e:
        logger.error(f"Get user orders error: {e}")
        return jsonify({'error': 'Failed to get orders'}), 500

@app.route('/api/orders/<int:order_id>/cancel', methods=['POST'])
@auth_required
def cancel_order(order_id):
    """Cancel order"""
    try:
        db = get_db()
        
        # Check if order belongs to user and can be cancelled
        order = db.execute(
            'SELECT * FROM orders WHERE order_id = ? AND user_id = ? AND status = "pending"',
            (order_id, g.current_user_id)
        ).fetchone()
        
        if not order:
            return jsonify({'error': 'Order not found or cannot be cancelled'}), 404
        
        # Update order status
        db.execute(
            'UPDATE orders SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
            (order_id,)
        )
        db.commit()
        
        return jsonify({'message': 'Order cancelled successfully'})
        
    except Exception as e:
        logger.error(f"Cancel order error: {e}")
        return jsonify({'error': 'Failed to cancel order'}), 500

# Chat routes
@app.route('/api/chat/messages', methods=['GET'])
@auth_required
def get_chat_messages():
    """Get chat messages for user"""
    try:
        db = get_db()
        messages = db.execute('''
            SELECT * FROM chat_messages 
            WHERE user_id = ? 
            ORDER BY created_at ASC
        ''', (g.current_user_id,)).fetchall()
        
        return jsonify([dict(message) for message in messages])
        
    except Exception as e:
        logger.error(f"Get chat messages error: {e}")
        return jsonify({'error': 'Failed to get messages'}), 500

@app.route('/api/chat/send', methods=['POST'])
@auth_required
def send_chat_message():
    """Send chat message"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({'error': 'Message required'}), 400
        
        db = get_db()
        db.execute('''
            INSERT INTO chat_messages (user_id, message)
            VALUES (?, ?)
        ''', (g.current_user_id, message))
        
        db.commit()
        
        return jsonify({'message': 'Message sent successfully'})
        
    except Exception as e:
        logger.error(f"Send chat message error: {e}")
        return jsonify({'error': 'Failed to send message'}), 500

# Admin routes
@app.route('/api/admin/stats', methods=['GET'])
@auth_required
@admin_required
def get_admin_stats():
    """Get admin statistics"""
    try:
        db = get_db()
        
        stats = {
            'total_users': db.execute('SELECT COUNT(*) as count FROM users').fetchone()['count'],
            'total_orders': db.execute('SELECT COUNT(*) as count FROM orders').fetchone()['count'],
            'total_programs': db.execute('SELECT COUNT(*) as count FROM programs WHERE is_active = TRUE').fetchone()['count'],
            'total_news': db.execute('SELECT COUNT(*) as count FROM news WHERE is_published = TRUE').fetchone()['count'],
            'pending_orders': db.execute('SELECT COUNT(*) as count FROM orders WHERE status = "pending"').fetchone()['count'],
            'total_revenue': db.execute('SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE status IN ("approved", "completed")').fetchone()['total']
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Get admin stats error: {e}")
        return jsonify({'error': 'Failed to get statistics'}), 500

@app.route('/api/admin/orders', methods=['GET'])
@auth_required
@admin_required
def get_all_orders():
    """Get all orders for admin"""
    try:
        db = get_db()
        orders = db.execute('''
            SELECT o.*, s.name as service_name, u.name as user_name, u.email as user_email
            FROM orders o
            JOIN services s ON o.service_id = s.service_id
            JOIN users u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
        ''').fetchall()
        
        return jsonify([dict(order) for order in orders])
        
    except Exception as e:
        logger.error(f"Get all orders error: {e}")
        return jsonify({'error': 'Failed to get orders'}), 500

@app.route('/api/admin/orders/<int:order_id>/approve', methods=['POST'])
@auth_required
@admin_required
def approve_order(order_id):
    """Approve order"""
    try:
        db = get_db()
        
        # Update order status
        db.execute(
            'UPDATE orders SET status = "approved", updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
            (order_id,)
        )
        db.commit()
        
        return jsonify({'message': 'Order approved successfully'})
        
    except Exception as e:
        logger.error(f"Approve order error: {e}")
        return jsonify({'error': 'Failed to approve order'}), 500

@app.route('/api/admin/orders/<int:order_id>/reject', methods=['POST'])
@auth_required
@admin_required
def reject_order(order_id):
    """Reject order"""
    try:
        data = request.get_json()
        reason = data.get('reason', 'Не указана')
        
        db = get_db()
        
        # Update order status
        db.execute(
            'UPDATE orders SET status = "rejected", admin_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
            (reason, order_id)
        )
        db.commit()
        
        return jsonify({'message': 'Order rejected successfully'})
        
    except Exception as e:
        logger.error(f"Reject order error: {e}")
        return jsonify({'error': 'Failed to reject order'}), 500

# Admin program management
@app.route('/api/admin/programs', methods=['POST'])
@auth_required
@admin_required
def create_program():
    """Create new program"""
    try:
        data = request.get_json()
        
        program_id = generate_id(6)
        
        db = get_db()
        db.execute('''
            INSERT INTO programs (program_id, name, description, language, version, icon)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (program_id, data['name'], data['description'], data.get('language'), 
              data.get('version', '1.0'), data.get('icon')))
        
        db.commit()
        
        return jsonify({'program_id': program_id, 'message': 'Program created successfully'})
        
    except Exception as e:
        logger.error(f"Create program error: {e}")
        return jsonify({'error': 'Failed to create program'}), 500

@app.route('/api/admin/programs/<int:program_id>', methods=['DELETE'])
@auth_required
@admin_required
def delete_program(program_id):
    """Delete program"""
    try:
        db = get_db()
        db.execute('UPDATE programs SET is_active = FALSE WHERE program_id = ?', (program_id,))
        db.commit()
        
        return jsonify({'message': 'Program deleted successfully'})
        
    except Exception as e:
        logger.error(f"Delete program error: {e}")
        return jsonify({'error': 'Failed to delete program'}), 500

# Admin news management
@app.route('/api/admin/news', methods=['POST'])
@auth_required
@admin_required
def create_news():
    """Create news item"""
    try:
        data = request.get_json()
        
        news_id = generate_id(8)
        
        db = get_db()
        db.execute('''
            INSERT INTO news (news_id, title, content, author_id)
            VALUES (?, ?, ?, ?)
        ''', (news_id, data['title'], data['content'], g.current_user_id))
        
        db.commit()
        
        return jsonify({'news_id': news_id, 'message': 'News created successfully'})
        
    except Exception as e:
        logger.error(f"Create news error: {e}")
        return jsonify({'error': 'Failed to create news'}), 500

@app.route('/api/admin/news/<int:news_id>', methods=['DELETE'])
@auth_required
@admin_required
def delete_news(news_id):
    """Delete news item"""
    try:
        db = get_db()
        db.execute('UPDATE news SET is_published = FALSE WHERE news_id = ?', (news_id,))
        db.commit()
        
        return jsonify({'message': 'News deleted successfully'})
        
    except Exception as e:
        logger.error(f"Delete news error: {e}")
        return jsonify({'error': 'Failed to delete news'}), 500

# Self-ping function to keep server alive
def ping_self():
    """Ping server to keep it alive"""
    while True:
        try:
            time.sleep(30)  # Ping every 30 seconds
            requests.get(f'http://localhost:{os.getenv("PORT", 5000)}/health', timeout=10)
            logger.info("Self-ping successful")
        except Exception as e:
            logger.error(f"Self-ping failed: {e}")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    # For SPA, return the main page
    return send_from_directory('.', 'index.html')

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Initialize and run
if __name__ == '__main__':
    # Initialize database
    init_database()
    
    # Start self-ping thread
    ping_thread = threading.Thread(target=ping_self, daemon=True)
    ping_thread.start()
    
    # Get port from environment
    port = int(os.getenv('PORT', 5000))
    
    logger.info(f"🚀 Phantom Services server starting on port {port}")
    
    # Run the app
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    )