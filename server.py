#!/usr/bin/env python3
"""
Phantom Services - Flask Server
Professional IT Services Platform
"""

import os
import sys
import time
import json
import csv
import hashlib
import secrets
import logging
import threading
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

import requests
from flask import Flask, request, jsonify, send_from_directory, g, render_template_string, redirect, url_for
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

# Security configuration - все пароли и ключи теперь в переменных окружения
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# CORS configuration
CORS(app, origins=['*'])

# Constants - безопасные переменные
DATABASE_FOLDER = 'data'
UPLOADS_FOLDER = 'uploads'
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '957687109285-gs24ojtjhjkatpi7n0rrpb1c57tf95e2.apps.googleusercontent.com')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', 'your_google_client_secret')

# Admin credentials - храним в переменных окружения
ADMIN_EMAILS = os.getenv('ADMIN_EMAILS', 'admin_phantom2000@phantom.com,aishchnko12@gmail.com').split(',')
ADMIN_PASSWORD_HASH = os.getenv('ADMIN_PASSWORD_HASH', generate_password_hash('phandmin2000_pwd'))

# Crypto wallet addresses - безопасное хранение
CRYPTO_WALLETS = {
    'uah': os.getenv('UAH_WALLET', '4149 6090 1876 9549'),
    'ton': os.getenv('TON_WALLET', 'UQCKtm0RoDtPCyObq18G-FKehsDPaVIiVX5Z8q78P_XfmTUh'),
    'usdt': os.getenv('USDT_WALLET', 'TYourUSDTAddressHere')
}

# Ensure directories exist
os.makedirs('logs', exist_ok=True)
os.makedirs(DATABASE_FOLDER, exist_ok=True)
os.makedirs(UPLOADS_FOLDER, exist_ok=True)
os.makedirs('static/images', exist_ok=True)

# CSV Database setup
def get_csv_path(table_name):
    """Get CSV file path for table"""
    return os.path.join(DATABASE_FOLDER, f'{table_name}.csv')

def read_csv_table(table_name):
    """Read CSV table"""
    csv_path = get_csv_path(table_name)
    if not os.path.exists(csv_path):
        return []
    
    try:
        with open(csv_path, 'r', encoding='utf-8', newline='') as file:
            reader = csv.DictReader(file)
            return list(reader)
    except Exception as e:
        logger.error(f"Error reading CSV {table_name}: {e}")
        return []

def write_csv_table(table_name, data, fieldnames=None):
    """Write CSV table"""
    csv_path = get_csv_path(table_name)
    
    if not data:
        return
    
    if fieldnames is None:
        fieldnames = data[0].keys() if data else []
    
    try:
        with open(csv_path, 'w', encoding='utf-8', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
    except Exception as e:
        logger.error(f"Error writing CSV {table_name}: {e}")

def append_csv_table(table_name, row, fieldnames=None):
    """Append row to CSV table"""
    csv_path = get_csv_path(table_name)
    
    # If file doesn't exist, create with header
    if not os.path.exists(csv_path):
        if fieldnames is None:
            fieldnames = row.keys()
        with open(csv_path, 'w', encoding='utf-8', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
    
    try:
        with open(csv_path, 'a', encoding='utf-8', newline='') as file:
            if fieldnames is None:
                # Read existing fieldnames
                with open(csv_path, 'r', encoding='utf-8') as read_file:
                    reader = csv.DictReader(read_file)
                    fieldnames = reader.fieldnames
            
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writerow(row)
    except Exception as e:
        logger.error(f"Error appending to CSV {table_name}: {e}")

def init_database():
    """Initialize CSV database with tables"""
    
    # Users table
    users_data = []
    for email in ADMIN_EMAILS:
        admin_id = generate_id(8)
        users_data.append({
            'user_id': admin_id,
            'name': 'Admin',
            'email': email,
            'phone': '',
            'country': '',
            'password_hash': ADMIN_PASSWORD_HASH,
            'google_id': '',
            'avatar_url': '',
            'is_admin': 'True',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })
    
    if not os.path.exists(get_csv_path('users')):
        write_csv_table('users', users_data)
    
    # Services table with categories
    services_data = [
        # Простые услуги
        {
            'service_id': '1',
            'name': 'Установка антивируса',
            'description': 'Установка и настройка антивирусного ПО',
            'price': '200.00',
            'duration': '30 минут',
            'icon': 'fas fa-shield-virus',
            'category': 'Простые',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        {
            'service_id': '2',
            'name': 'Очистка от мусора',
            'description': 'Очистка системы от временных файлов и мусора',
            'price': '150.00',
            'duration': '20 минут',
            'icon': 'fas fa-broom',
            'category': 'Простые',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        {
            'service_id': '3',
            'name': 'Установка драйверов',
            'description': 'Поиск и установка необходимых драйверов',
            'price': '250.00',
            'duration': '45 минут',
            'icon': 'fas fa-download',
            'category': 'Простые',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        
        # Средние услуги
        {
            'service_id': '4',
            'name': 'Разблокировка загрузчика',
            'description': 'Разблокировка bootloader для Android устройств',
            'price': '500.00',
            'duration': '1-2 дня',
            'icon': 'fas fa-unlock',
            'category': 'Средние',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        {
            'service_id': '5',
            'name': 'Установка root-прав',
            'description': 'Получение root доступа на Android устройствах',
            'price': '300.00',
            'duration': '1 день',
            'icon': 'fas fa-user-shield',
            'category': 'Средние',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        {
            'service_id': '6',
            'name': 'Установка ОС (ПК)',
            'description': 'Установка Windows, Linux и настройка системы',
            'price': '400.00',
            'duration': '1 день',
            'icon': 'fas fa-desktop',
            'category': 'Средние',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        {
            'service_id': '7',
            'name': 'Удаление вирусов',
            'description': 'Полная очистка от вирусов и вредоносного ПО',
            'price': '350.00',
            'duration': '1 день',
            'icon': 'fas fa-shield-virus',
            'category': 'Средние',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        {
            'service_id': '8',
            'name': 'Настройка сети',
            'description': 'Настройка роутеров, Wi-Fi и сетевого оборудования',
            'price': '450.00',
            'duration': '1-2 дня',
            'icon': 'fas fa-network-wired',
            'category': 'Средние',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        
        # Продвинутые услуги
        {
            'service_id': '9',
            'name': 'Прошивка устройств',
            'description': 'Установка кастомных прошивок и восстановление',
            'price': '800.00',
            'duration': '2-3 дня',
            'icon': 'fas fa-microchip',
            'category': 'Продвинутые',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        {
            'service_id': '10',
            'name': 'Разработка ПО',
            'description': 'Создание индивидуального программного обеспечения',
            'price': '2000.00',
            'duration': '1-2 недели',
            'icon': 'fas fa-code',
            'category': 'Продвинутые',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        {
            'service_id': '11',
            'name': 'Настройка сервера',
            'description': 'Установка и настройка серверного ПО',
            'price': '1500.00',
            'duration': '3-5 дней',
            'icon': 'fas fa-server',
            'category': 'Продвинутые',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        },
        {
            'service_id': '12',
            'name': 'Восстановление данных',
            'description': 'Восстановление утерянных или поврежденных данных',
            'price': '1200.00',
            'duration': '2-7 дней',
            'icon': 'fas fa-hdd',
            'category': 'Продвинутые',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        }
    ]
    
    if not os.path.exists(get_csv_path('services')):
        write_csv_table('services', services_data)
    
    # Initialize other tables
    for table in ['programs', 'news', 'orders', 'chat_messages', 'downloads']:
        if not os.path.exists(get_csv_path(table)):
            write_csv_table(table, [])
    
    logger.info("CSV Database initialized successfully")

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
        
        g.current_user_id = str(user_id)
        return f(*args, **kwargs)
    
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'current_user_id'):
            return jsonify({'error': 'Authentication required'}), 401
        
        users = read_csv_table('users')
        user = next((u for u in users if u['user_id'] == g.current_user_id), None)
        
        if not user or (user['is_admin'] != 'True' and user['email'] not in ADMIN_EMAILS):
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
        users = read_csv_table('users')
        orders = read_csv_table('orders')
        
        return jsonify({
            'status': 'online',
            'users': len(users),
            'orders': len(orders),
            'uptime': time.time(),
            'crypto_wallets': CRYPTO_WALLETS
        })
    except Exception as e:
        logger.error(f"Status check error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Google OAuth routes
@app.route('/auth/google')
def google_auth():
    """Redirect to Google OAuth"""
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={request.url_root}auth/google/callback&"
        f"scope=openid email profile&"
        f"response_type=code"
    )
    return redirect(google_auth_url)

@app.route('/auth/google/callback')
def google_callback():
    """Handle Google OAuth callback"""
    code = request.args.get('code')
    if not code:
        return redirect('/?error=google_auth_failed')
    
    try:
        # Exchange code for token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': f"{request.url_root}auth/google/callback"
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_json = token_response.json()
        
        if 'access_token' not in token_json:
            return redirect('/?error=google_token_failed')
        
        # Get user info
        user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={token_json['access_token']}"
        user_response = requests.get(user_info_url)
        user_data = user_response.json()
        
        # Process user login
        users = read_csv_table('users')
        user = next((u for u in users if u['email'] == user_data['email']), None)
        
        is_admin = user_data['email'] in ADMIN_EMAILS
        
        if user:
            # Update existing user
            user['google_id'] = user_data['id']
            user['avatar_url'] = user_data.get('picture', '')
            user['is_admin'] = str(is_admin)
            user['updated_at'] = datetime.now().isoformat()
            user_id = user['user_id']
        else:
            # Create new user
            user_id = str(generate_id(8))
            new_user = {
                'user_id': user_id,
                'name': user_data['name'],
                'email': user_data['email'],
                'phone': '',
                'country': '',
                'password_hash': '',
                'google_id': user_data['id'],
                'avatar_url': user_data.get('picture', ''),
                'is_admin': str(is_admin),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            users.append(new_user)
        
        write_csv_table('users', users)
        
        # Generate token
        token = generate_token(user_id)
        
        # Redirect with token
        return redirect(f'/?token={token}&google_login=success')
        
    except Exception as e:
        logger.error(f"Google OAuth error: {e}")
        return redirect('/?error=google_auth_error')

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
        users = read_csv_table('users')
        existing_user = next((u for u in users if u['email'] == data['email']), None)
        
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user_id = str(generate_id(8))
        password_hash = generate_password_hash(data['password'])
        is_admin = data['email'] in ADMIN_EMAILS
        
        new_user = {
            'user_id': user_id,
            'name': data['name'],
            'email': data['email'],
            'phone': data.get('phone', ''),
            'country': data['country'],
            'password_hash': password_hash,
            'google_id': '',
            'avatar_url': '',
            'is_admin': str(is_admin),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        append_csv_table('users', new_user)
        
        # Generate token
        token = generate_token(user_id)
        
        # Get orders count
        orders = read_csv_table('orders')
        orders_count = len([o for o in orders if o['user_id'] == user_id])
        
        user_data = new_user.copy()
        user_data['orders_count'] = orders_count
        del user_data['password_hash']  # Remove sensitive data
        
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
        
        users = read_csv_table('users')
        user = next((u for u in users if u['email'] == email), None)
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update admin status if needed
        is_admin = email in ADMIN_EMAILS
        if str(is_admin) != user['is_admin']:
            user['is_admin'] = str(is_admin)
            user['updated_at'] = datetime.now().isoformat()
            write_csv_table('users', users)
        
        # Generate token
        token = generate_token(user['user_id'])
        
        # Get orders count
        orders = read_csv_table('orders')
        orders_count = len([o for o in orders if o['user_id'] == user['user_id']])
        
        user_data = user.copy()
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
    """Google OAuth login (for frontend token verification)"""
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
        
        users = read_csv_table('users')
        user = next((u for u in users if u['email'] == email or u['google_id'] == google_id), None)
        
        is_admin = email in ADMIN_EMAILS
        
        if user:
            # Update existing user
            user['google_id'] = google_id
            user['avatar_url'] = avatar_url
            user['is_admin'] = str(is_admin)
            user['updated_at'] = datetime.now().isoformat()
            user_id = user['user_id']
        else:
            # Create new user
            user_id = str(generate_id(8))
            new_user = {
                'user_id': user_id,
                'name': name,
                'email': email,
                'phone': '',
                'country': '',
                'password_hash': '',
                'google_id': google_id,
                'avatar_url': avatar_url,
                'is_admin': str(is_admin),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            users.append(new_user)
            user = new_user
        
        write_csv_table('users', users)
        
        # Generate token
        token = generate_token(user_id)
        
        # Get orders count
        orders = read_csv_table('orders')
        orders_count = len([o for o in orders if o['user_id'] == user_id])
        
        user_data = user.copy()
        user_data['orders_count'] = orders_count
        del user_data['password_hash']  # Remove sensitive data
        
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
        users = read_csv_table('users')
        user = next((u for u in users if u['user_id'] == g.current_user_id), None)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check admin status
        is_admin = user['email'] in ADMIN_EMAILS if user['email'] else user['is_admin'] == 'True'
        
        # Get orders count
        orders = read_csv_table('orders')
        orders_count = len([o for o in orders if o['user_id'] == g.current_user_id])
        
        user_data = user.copy()
        user_data['orders_count'] = orders_count
        user_data['is_admin'] = is_admin
        del user_data['password_hash']  # Remove sensitive data
        
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
        services = read_csv_table('services')
        active_services = [s for s in services if s.get('is_active') == 'True']
        
        # Convert string prices to float for JSON
        for service in active_services:
            service['price'] = float(service['price'])
        
        return jsonify(active_services)
        
    except Exception as e:
        logger.error(f"Get services error: {e}")
        return jsonify({'error': 'Failed to get services'}), 500

# Programs routes
@app.route('/api/programs', methods=['GET'])
def get_programs():
    """Get all active programs"""
    try:
        programs = read_csv_table('programs')
        active_programs = [p for p in programs if p.get('is_active') == 'True']
        return jsonify(active_programs)
        
    except Exception as e:
        logger.error(f"Get programs error: {e}")
        return jsonify({'error': 'Failed to get programs'}), 500

# News routes
@app.route('/api/news', methods=['GET'])
def get_news():
    """Get all published news"""
    try:
        news = read_csv_table('news')
        published_news = [n for n in news if n.get('is_published') == 'True']
        return jsonify(published_news)
        
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
        services = read_csv_table('services')
        service = next((s for s in services if s['service_id'] == service_id), None)
        
        if not service or service.get('is_active') != 'True':
            return jsonify({'error': 'Service not found'}), 404
        
        # Get user info
        users = read_csv_table('users')
        user = next((u for u in users if u['user_id'] == g.current_user_id), None)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
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
        order_id = str(generate_id(6))
        
        new_order = {
            'order_id': order_id,
            'user_id': g.current_user_id,
            'service_id': service_id,
            'comments': comments,
            'price': service['price'],
            'payment_method': payment_method,
            'status': 'pending',
            'payment_proof_path': payment_proof_path or '',
            'admin_comment': '',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        append_csv_table('orders', new_order)
        
        return jsonify({
            'order_id': order_id,
            'message': 'Order created successfully',
            'receipt_data': {
                'order_id': order_id,
                'user_name': user['name'],
                'user_email': user['email'],
                'service_name': service['name'],
                'price': float(service['price']),
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
        orders = read_csv_table('orders')
        services = read_csv_table('services')
        
        user_orders = [o for o in orders if o['user_id'] == g.current_user_id]
        
        # Add service names
        for order in user_orders:
            service = next((s for s in services if s['service_id'] == order['service_id']), None)
            order['service_name'] = service['name'] if service else 'Unknown Service'
            order['price'] = float(order['price'])
        
        # Sort by creation date (newest first)
        user_orders.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify(user_orders)
        
    except Exception as e:
        logger.error(f"Get user orders error: {e}")
        return jsonify({'error': 'Failed to get orders'}), 500

@app.route('/api/orders/<order_id>/cancel', methods=['POST'])
@auth_required
def cancel_order(order_id):
    """Cancel order"""
    try:
        orders = read_csv_table('orders')
        order = next((o for o in orders if o['order_id'] == order_id and o['user_id'] == g.current_user_id), None)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        if order['status'] != 'pending':
            return jsonify({'error': 'Order cannot be cancelled'}), 400
        
        # Update order status
        order['status'] = 'cancelled'
        order['updated_at'] = datetime.now().isoformat()
        
        write_csv_table('orders', orders)
        
        return jsonify({'message': 'Order cancelled successfully'})
        
    except Exception as e:
        logger.error(f"Cancel order error: {e}")
        return jsonify({'error': 'Failed to cancel order'}), 500

# Admin routes
@app.route('/api/admin/stats', methods=['GET'])
@auth_required
@admin_required
def get_admin_stats():
    """Get admin statistics"""
    try:
        users = read_csv_table('users')
        orders = read_csv_table('orders')
        programs = read_csv_table('programs')
        news = read_csv_table('news')
        
        # Calculate revenue
        approved_orders = [o for o in orders if o['status'] in ['approved', 'completed']]
        total_revenue = sum(float(o['price']) for o in approved_orders)
        
        stats = {
            'total_users': len(users),
            'total_orders': len(orders),
            'total_programs': len([p for p in programs if p.get('is_active') == 'True']),
            'total_news': len([n for n in news if n.get('is_published') == 'True']),
            'pending_orders': len([o for o in orders if o['status'] == 'pending']),
            'total_revenue': total_revenue
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
        orders = read_csv_table('orders')
        services = read_csv_table('services')
        users = read_csv_table('users')
        
        # Add service and user names
        for order in orders:
            service = next((s for s in services if s['service_id'] == order['service_id']), None)
            user = next((u for u in users if u['user_id'] == order['user_id']), None)
            
            order['service_name'] = service['name'] if service else 'Unknown Service'
            order['user_name'] = user['name'] if user else 'Unknown User'
            order['user_email'] = user['email'] if user else 'Unknown Email'
            order['price'] = float(order['price'])
        
        # Sort by creation date (newest first)
        orders.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify(orders)
        
    except Exception as e:
        logger.error(f"Get all orders error: {e}")
        return jsonify({'error': 'Failed to get orders'}), 500

@app.route('/api/admin/orders/<order_id>/approve', methods=['POST'])
@auth_required
@admin_required
def approve_order(order_id):
    """Approve order"""
    try:
        orders = read_csv_table('orders')
        order = next((o for o in orders if o['order_id'] == order_id), None)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Update order status
        order['status'] = 'approved'
        order['updated_at'] = datetime.now().isoformat()
        
        write_csv_table('orders', orders)
        
        return jsonify({'message': 'Order approved successfully'})
        
    except Exception as e:
        logger.error(f"Approve order error: {e}")
        return jsonify({'error': 'Failed to approve order'}), 500

@app.route('/api/admin/orders/<order_id>/reject', methods=['POST'])
@auth_required
@admin_required
def reject_order(order_id):
    """Reject order"""
    try:
        data = request.get_json()
        reason = data.get('reason', 'Не указана')
        
        orders = read_csv_table('orders')
        order = next((o for o in orders if o['order_id'] == order_id), None)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Update order status
        order['status'] = 'rejected'
        order['admin_comment'] = reason
        order['updated_at'] = datetime.now().isoformat()
        
        write_csv_table('orders', orders)
        
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
        
        program_id = str(generate_id(6))
        
        new_program = {
            'program_id': program_id,
            'name': data['name'],
            'description': data['description'],
            'language': data.get('language', 'Python'),
            'version': data.get('version', '1.0'),
            'icon': data.get('icon', 'fas fa-code'),
            'file_path': '',
            'download_count': '0',
            'is_active': 'True',
            'created_at': datetime.now().isoformat()
        }
        
        append_csv_table('programs', new_program)
        
        return jsonify({'program_id': program_id, 'message': 'Program created successfully'})
        
    except Exception as e:
        logger.error(f"Create program error: {e}")
        return jsonify({'error': 'Failed to create program'}), 500

@app.route('/api/admin/programs/<program_id>', methods=['DELETE'])
@auth_required
@admin_required
def delete_program(program_id):
    """Delete program"""
    try:
        programs = read_csv_table('programs')
        program = next((p for p in programs if p['program_id'] == program_id), None)
        
        if not program:
            return jsonify({'error': 'Program not found'}), 404
        
        program['is_active'] = 'False'
        write_csv_table('programs', programs)
        
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
        
        news_id = str(generate_id(8))
        
        new_news = {
            'news_id': news_id,
            'title': data['title'],
            'content': data['content'],
            'author_id': g.current_user_id,
            'author_name': 'Admin',
            'is_published': 'True',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        append_csv_table('news', new_news)
        
        return jsonify({'news_id': news_id, 'message': 'News created successfully'})
        
    except Exception as e:
        logger.error(f"Create news error: {e}")
        return jsonify({'error': 'Failed to create news'}), 500

@app.route('/api/admin/news/<news_id>', methods=['DELETE'])
@auth_required
@admin_required
def delete_news(news_id):
    """Delete news item"""
    try:
        news = read_csv_table('news')
        news_item = next((n for n in news if n['news_id'] == news_id), None)
        
        if not news_item:
            return jsonify({'error': 'News not found'}), 404
        
        news_item['is_published'] = 'False'
        write_csv_table('news', news)
        
        return jsonify({'message': 'News deleted successfully'})
        
    except Exception as e:
        logger.error(f"Delete news error: {e}")
        return jsonify({'error': 'Failed to delete news'}), 500

# Get all users for admin
@app.route('/api/admin/users', methods=['GET'])
@auth_required
@admin_required
def get_all_users():
    """Get all users for admin"""
    try:
        users = read_csv_table('users')
        orders = read_csv_table('orders')
        
        # Add orders count for each user
        for user in users:
            user_orders = [o for o in orders if o['user_id'] == user['user_id']]
            user['orders_count'] = len(user_orders)
            # Remove sensitive data
            if 'password_hash' in user:
                del user['password_hash']
        
        return jsonify(users)
        
    except Exception as e:
        logger.error(f"Get all users error: {e}")
        return jsonify({'error': 'Failed to get users'}), 500

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