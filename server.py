#!/usr/bin/env python3
"""
Pankratov Tech - Flask Server
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
from flask import Flask, request, jsonify, send_from_directory, g
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
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'pankratov-tech-secret-key-2025')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# CORS configuration
CORS(app, origins=['*'])

# Constants
DATABASE_FILE = 'pankratov_tech.db'
UPLOADS_FOLDER = 'uploads'
GOOGLE_CLIENT_ID = '957687109285-gs24ojtjhjkatpi7n0rrpb1c57tf95e2.apps.googleusercontent.com'

# Ensure directories exist
os.makedirs('logs', exist_ok=True)
os.makedirs(UPLOADS_FOLDER, exist_ok=True)

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
def close_db(error):
    close_db()

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
            status TEXT DEFAULT 'pending',
            payment_proof_path TEXT,
            admin_comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id),
            FOREIGN KEY (service_id) REFERENCES services (service_id)
        )
    ''')
    
    # Receipts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS receipts (
            receipt_id TEXT PRIMARY KEY,
            order_id INTEGER NOT NULL,
            receipt_type TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders (order_id)
        )
    ''')
    
    # Notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
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
    
    # Create admin user if not exists
    cursor.execute('SELECT COUNT(*) FROM users WHERE is_admin = TRUE')
    if cursor.fetchone()[0] == 0:
        admin_id = generate_id(8)
        cursor.execute('''
            INSERT INTO users (user_id, name, email, password_hash, is_admin)
            VALUES (?, ?, ?, ?, ?)
        ''', (admin_id, 'Admin', 'admin@pankratov.tech', generate_password_hash('admin123'), True))
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# Utility functions
def generate_id(length):
    """Generate random numeric ID"""
    return int(''.join([str(secrets.randbelow(10)) for _ in range(length)]))

def generate_receipt_id():
    """Generate 16-digit receipt ID"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(16)])

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
            'SELECT is_admin FROM users WHERE user_id = ?',
            (g.current_user_id,)
        ).fetchone()
        
        if not user or not user['is_admin']:
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

# Routes
@app.route('/')
def index():
    """Serve main page"""
    return send_from_directory('.', 'index.html')

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

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
        
        db.execute('''
            INSERT INTO users (user_id, name, email, phone, country, password_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, data['name'], data['email'], data.get('phone'), data['country'], password_hash))
        
        db.commit()
        
        # Generate token
        token = generate_token(user_id)
        
        # Get user data
        user = db.execute(
            'SELECT user_id, name, email, phone, country, is_admin, created_at FROM users WHERE user_id = ?',
            (user_id,)
        ).fetchone()
        
        return jsonify({
            'token': token,
            'user': dict(user)
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
        
        if user:
            # Update existing user
            db.execute('''
                UPDATE users SET google_id = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            ''', (google_id, avatar_url, user['user_id']))
            user_id = user['user_id']
        else:
            # Create new user
            user_id = generate_id(8)
            db.execute('''
                INSERT INTO users (user_id, name, email, google_id, avatar_url)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, name, email, google_id, avatar_url))
        
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
        
        # Get orders count
        orders_count = db.execute(
            'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
            (g.current_user_id,)
        ).fetchone()['count']
        
        user_data = dict(user)
        user_data['orders_count'] = orders_count
        
        return jsonify(user_data)
        
    except Exception as e:
        logger.error(f"Get current user error: {e}")
        return jsonify({'error': 'Failed to get user info'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@auth_required
def logout():
    """User logout"""
    # In a real app, you might want to blacklist the token
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

@app.route('/api/services/<int:service_id>', methods=['GET'])
def get_service(service_id):
    """Get specific service"""
    try:
        db = get_db()
        service = db.execute(
            'SELECT * FROM services WHERE service_id = ? AND is_active = TRUE',
            (service_id,)
        ).fetchone()
        
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        return jsonify(dict(service))
        
    except Exception as e:
        logger.error(f"Get service error: {e}")
        return jsonify({'error': 'Failed to get service'}), 500

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

@app.route('/api/programs/<int:program_id>/download', methods=['GET'])
def download_program(program_id):
    """Download program file"""
    try:
        db = get_db()
        program = db.execute(
            'SELECT * FROM programs WHERE program_id = ? AND is_active = TRUE',
            (program_id,)
        ).fetchone()
        
        if not program:
            return jsonify({'error': 'Program not found'}), 404
        
        # Update download count
        db.execute(
            'UPDATE programs SET download_count = download_count + 1 WHERE program_id = ?',
            (program_id,)
        )
        db.commit()
        
        # In a real app, you would serve the actual file
        # For now, return a placeholder response
        return jsonify({'message': 'Download started', 'filename': f"{program['name']}.zip"})
        
    except Exception as e:
        logger.error(f"Download program error: {e}")
        return jsonify({'error': 'Download failed'}), 500

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
        
        if not service_id:
            return jsonify({'error': 'Service ID required'}), 400
        
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
        order_id = generate_id(4)
        
        db.execute('''
            INSERT INTO orders (order_id, user_id, service_id, comments, price, payment_proof_path)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (order_id, g.current_user_id, service_id, comments, service['price'], payment_proof_path))
        
        # Create receipt
        receipt_id = generate_receipt_id()
        receipt_content = generate_receipt_content('order_created', {
            'receipt_id': receipt_id,
            'order_id': order_id,
            'user_name': user['name'],
            'user_email': user['email'],
            'service_name': service['name'],
            'price': service['price']
        })
        
        db.execute('''
            INSERT INTO receipts (receipt_id, order_id, receipt_type, content)
            VALUES (?, ?, ?, ?)
        ''', (receipt_id, order_id, 'order_created', receipt_content))
        
        db.commit()
        
        return jsonify({
            'order_id': order_id,
            'receipt_data': {
                'receipt_id': receipt_id,
                'order_id': order_id,
                'user_name': user['name'],
                'user_email': user['email'],
                'service_name': service['name'],
                'price': service['price']
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

# User profile routes
@app.route('/api/user/profile', methods=['PUT'])
@auth_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        
        db = get_db()
        db.execute('''
            UPDATE users SET name = ?, phone = ?, country = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        ''', (data.get('name'), data.get('phone'), data.get('country'), g.current_user_id))
        
        db.commit()
        
        return jsonify({'message': 'Profile updated successfully'})
        
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        return jsonify({'error': 'Failed to update profile'}), 500

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
        
        # Get order details
        order = db.execute('''
            SELECT o.*, s.name as service_name, u.name as user_name, u.email as user_email
            FROM orders o
            JOIN services s ON o.service_id = s.service_id
            JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?
        ''', (order_id,)).fetchone()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Update order status
        db.execute(
            'UPDATE orders SET status = "approved", updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
            (order_id,)
        )
        
        # Create approval receipt
        receipt_id = generate_receipt_id()
        receipt_content = generate_receipt_content('order_approved', {
            'receipt_id': receipt_id,
            'order_id': order_id,
            'user_name': order['user_name'],
            'user_email': order['user_email'],
            'service_name': order['service_name'],
            'price': order['price']
        })
        
        db.execute('''
            INSERT INTO receipts (receipt_id, order_id, receipt_type, content)
            VALUES (?, ?, ?, ?)
        ''', (receipt_id, order_id, 'order_approved', receipt_content))
        
        # Create notification for user
        db.execute('''
            INSERT INTO notifications (user_id, title, message)
            VALUES (?, ?, ?)
        ''', (order['user_id'], 'Заказ одобрен', f'Ваш заказ #{order_id} был одобрен и принят в работу.'))
        
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
        
        # Get order details
        order = db.execute('''
            SELECT o.*, s.name as service_name, u.name as user_name, u.email as user_email
            FROM orders o
            JOIN services s ON o.service_id = s.service_id
            JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?
        ''', (order_id,)).fetchone()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Update order status
        db.execute(
            'UPDATE orders SET status = "rejected", admin_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
            (reason, order_id)
        )
        
        # Create rejection receipt
        receipt_id = generate_receipt_id()
        receipt_content = generate_receipt_content('order_rejected', {
            'receipt_id': receipt_id,
            'order_id': order_id,
            'user_name': order['user_name'],
            'user_email': order['user_email'],
            'service_name': order['service_name'],
            'price': order['price'],
            'reason': reason
        })
        
        db.execute('''
            INSERT INTO receipts (receipt_id, order_id, receipt_type, content)
            VALUES (?, ?, ?, ?)
        ''', (receipt_id, order_id, 'order_rejected', receipt_content))
        
        # Create notification for user
        db.execute('''
            INSERT INTO notifications (user_id, title, message)
            VALUES (?, ?, ?)
        ''', (order['user_id'], 'Заказ отклонен', f'Ваш заказ #{order_id} был отклонен. Причина: {reason}. Свяжитесь с администратором для выяснения деталей.'))
        
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

# Utility functions
def generate_receipt_content(receipt_type, data):
    """Generate receipt content"""
    templates = {
        'order_created': f"""
PANKRATOV TECH
Чек об оформлении заказа

========================================
Чек ID: {data['receipt_id']}
Тип чека: Оформление заказа
========================================

Дата: {datetime.now().strftime('%d.%m.%Y %H:%M')}
Заказ №: {data['order_id']}
Клиент: {data['user_name']}
Email: {data['user_email']}

Услуга: {data['service_name']}
Цена: {data['price']} UAH

Статус: Ожидает подтверждения оплаты

========================================
Спасибо за ваш заказ!
Pankratov Tech - Профессиональные IT-услуги
        """,
        
        'order_approved': f"""
PANKRATOV TECH
Чек об одобрении заказа

========================================
Чек ID: {data['receipt_id']}
Тип чека: Одобрение заказа
========================================

Дата: {datetime.now().strftime('%d.%m.%Y %H:%M')}
Заказ №: {data['order_id']}
Клиент: {data['user_name']}
Email: {data['user_email']}

Услуга: {data['service_name']}
Цена: {data['price']} UAH

Статус: ОДОБРЕН - Принят в работу

========================================
Ваш заказ одобрен и будет выполнен в ближайшее время.
Pankratov Tech - Профессиональные IT-услуги
        """,
        
        'order_rejected': f"""
PANKRATOV TECH
Чек об отклонении заказа

========================================
Чек ID: {data['receipt_id']}
Тип чека: Отклонение заказа
========================================

Дата: {datetime.now().strftime('%d.%m.%Y %H:%M')}
Заказ №: {data['order_id']}
Клиент: {data['user_name']}
Email: {data['user_email']}

Услуга: {data['service_name']}
Цена: {data['price']} UAH

Статус: ОТКЛОНЕН
Причина: {data.get('reason', 'Не указана')}

========================================
Для выяснения причин свяжитесь с администратором.
Pankratov Tech - Профессиональные IT-услуги
        """
    }
    
    return templates.get(receipt_type, 'Unknown receipt type')

# Self-ping function to keep server alive
def ping_self():
    """Ping server to keep it alive"""
    while True:
        try:
            time.sleep(60)  # Ping every minute
            requests.get(f'http://localhost:{os.getenv("PORT", 5000)}/health', timeout=10)
            logger.info("Self-ping successful")
        except Exception as e:
            logger.error(f"Self-ping failed: {e}")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

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
    
    logger.info(f"🚀 Pankratov Tech server starting on port {port}")
    
    # Run the app
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    )