import logging
import sqlite3
import datetime
import asyncio
import os
import sys
import time
import signal
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    CallbackQueryHandler,
    ConversationHandler,
    ContextTypes,
)
from telegram.helpers import escape_markdown
import telegram.error
from typing import Union, Any

# --- Logging Configuration ---
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/bot.log') if os.path.exists('logs') else logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# --- Status File Management ---
BOT_STATUS_FILE = "bot_status.txt"

def update_status_file():
    """Update status file to indicate bot is running"""
    try:
        with open(BOT_STATUS_FILE, 'w') as f:
            f.write(f"Bot running at {time.time()}")
    except Exception as e:
        logger.error(f"Failed to update status file: {e}")

def cleanup_on_exit():
    """Cleanup function called on bot shutdown"""
    logger.info("🧹 Cleaning up bot resources...")
    try:
        if os.path.exists(BOT_STATUS_FILE):
            os.remove(BOT_STATUS_FILE)
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"📡 Bot received signal {signum}, shutting down...")
    cleanup_on_exit()
    sys.exit(0)

# --- Database Management ---
DB_FILE = "rootzsu_bot_v3.db"

def get_db_connection():
    """Establishes and returns a connection to the SQLite database."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def setup_database(initial_admin_id: int):
    """Initializes the database schema and adds the first admin."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY, username TEXT, first_name TEXT, last_name TEXT,
        join_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active'
    )""")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admins (
        user_id INTEGER PRIMARY KEY,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
    )""")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS services (
        service_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
        description TEXT, price_usd REAL, price_btc REAL, price_stars INTEGER,
        is_active INTEGER DEFAULT 1
    )""")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, service_id INTEGER,
        payment_method TEXT, status TEXT DEFAULT 'pending_payment',
        payment_proof TEXT, creation_date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (service_id) REFERENCES services (service_id)
    )""")
    cursor.execute("""
CREATE TABLE IF NOT EXISTS payment_proofs (
    proof_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    file_id TEXT NOT NULL,
    file_type TEXT,
    status TEXT DEFAULT 'uploaded',
    admin_comment TEXT,
    upload_date TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (order_id)
)""")
    
    # --- Check and add new columns if they don't exist ---
    cursor.execute("PRAGMA table_info(services)")
    columns = [row['name'] for row in cursor.fetchall()]
    
    if 'price_eur' not in columns:
        cursor.execute("ALTER TABLE services ADD COLUMN price_eur REAL")
        logger.info("Added 'price_eur' column to 'services' table.")
    
    if 'price_uah' not in columns:
        cursor.execute("ALTER TABLE services ADD COLUMN price_uah REAL")
        logger.info("Added 'price_uah' column to 'services' table.")
    
    cursor.execute("SELECT COUNT(*) FROM admins")
    if cursor.fetchone()[0] == 0 and initial_admin_id:
        cursor.execute("INSERT OR IGNORE INTO users (user_id, first_name, join_date) VALUES (?, ?, ?)",
                       (initial_admin_id, 'Initial Admin', datetime.datetime.now().isoformat()))
        cursor.execute("INSERT OR IGNORE INTO admins (user_id) VALUES (?)", (initial_admin_id,))
        logger.info(f"Initial admin with ID {initial_admin_id} has been set.")

    cursor.execute("SELECT COUNT(*) FROM services")
    if cursor.fetchone()[0] == 0:
        # --- ИЗМЕНЕННЫЙ БЛОК С ЦЕНАМИ ---
        services_data = [
            # (name, description, price_usd, price_btc, price_stars, price_eur, price_uah, is_active)
            ("Разблокировка загрузчика", "Для мобильных устройств", 16.0, 0.000200, 2500, 13.65, 661.0, 1),
            ("Установка root-прав", "Для мобильных устройств", 3.0, 0.00003, 300, 2.56, 124.0, 1),
            ("Прошивка устройств", "Полная переустановка системы", 20.0, 0.00020, 3500, 17.06, 826.0, 1),
            ("Установка ОС (ПК)", "Windows, Linux", 8.0, 0.000080, 1000, 6.82, 330.5, 1),
            ("Установка рекавери", "Для мобильных устройств", 6.0, 0.00006, 600, 5.12, 248.0, 1),
            ("Удаление вирусов", "Для ПК и мобильных устройств", 15.0, 0.00015, 1500, 12.80, 620.0, 1)
        ]
        cursor.executemany("INSERT INTO services (name, description, price_usd, price_btc, price_stars, price_eur, price_uah, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", services_data)
        logger.info("Default services have been added.")
    conn.commit()
    conn.close()

# --- Configuration & Constants ---
INITIAL_ADMIN_ID = 7498691085  # !!! ЗАМЕНИТЕ НА ВАШ TELEGRAM ID !!!
BOT_TOKEN = "8321468729:AAG7slkyM86fjTHwD7vTOF2NjaGjxUoHosc" # !!! ЗАМЕНИТЕ НА ВАШ ТОКЕН !!!

PAYMENT_WALLET_USD = "UQCKtm0RoDtPCyObq18G-FKehsDPaVIiVX5Z8q78P_XfmTUh"
PAYMENT_WALLET_BTC = "1DSxcGNMgtGE6i6ZALVn4g9kqc9F2ABtSp"
PAYMENT_WALLET_EUR = "NOT ADDED YET"
PAYMENT_WALLET_UAH = "4149 6090 1876 9549"
ADMIN_CHAT_ID = INITIAL_ADMIN_ID

# --- НОВЫЕ СТАТУСЫ ДЛЯ ОБРАБОТЧИКА РАЗГОВОРА ---
(STATE_MAIN_MENU, STATE_SELECTING_SERVICE, STATE_SELECTING_PAYMENT, STATE_UPLOADING_PROOF, 
 STATE_ADMIN_CHAT, STATE_ADMIN_ADD_ID, STATE_ADMIN_REMOVE_ID, STATE_ADMIN_BROADCAST_MESSAGE, 
 STATE_USER_TO_ADMIN_CHAT, STATE_ADMIN_MANAGE_SERVICES, STATE_ADMIN_ADD_SERVICE,
 STATE_ADMIN_EDIT_SERVICE_SELECT, STATE_ADMIN_EDIT_SERVICE_DATA, STATE_ADMIN_REJECT_PROOF) = range(14)


# --- Helper Functions ---
async def is_admin(user_id: int) -> bool:
    """Checks if a user is an administrator by querying the database."""
    conn = get_db_connection()
    admin = conn.execute("SELECT 1 FROM admins WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    return admin is not None

def get_user_mention(user: Union[Update.effective_user, sqlite3.Row]) -> str:
    """Creates a MarkdownV2 mention for a user, handling both Telegram User objects and database rows."""
    if hasattr(user, 'first_name'):
        # This is a Telegram User object
        safe_name = escape_markdown(user.first_name or str(user.id), version=2)
        return f"[{safe_name}](tg://user?id={user.id})"
    else:
        # This is a dict-like object from the database
        safe_name = escape_markdown(user['first_name'] or str(user['user_id']), version=2)
        return f"[{safe_name}](tg://user?id={user['user_id']})"

# --- Core User Handlers (start, price list, my account) ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handles /start, registers the user, and shows the main menu with a banner."""
    user = update.effective_user
    conn = get_db_connection()
    if conn.execute("SELECT 1 FROM users WHERE user_id = ?", (user.id,)).fetchone() is None:
        conn.execute(
            "INSERT INTO users (user_id, username, first_name, last_name, join_date) VALUES (?, ?, ?, ?, ?)",
            (user.id, user.username, user.first_name, user.last_name, datetime.datetime.now().isoformat())
        )
        conn.commit()
    conn.close()
    
    # --- БАННЕР ---
    safe_first_name = escape_markdown(user.first_name, version=2)
    banner_text = (
        f"⭐️⭐️⭐️ *ДОБРО ПОЖАЛОВАТЬ В БОТ ROOTZSU* ⭐️⭐️⭐️\n\n"
        f"Привет, {safe_first_name}\\! Мы рады видеть тебя\\.\n"
        f"Здесь ты можешь заказать услуги по настройке и обслуживанию мобильных устройств и ПК\\.\n\n"
        f"Выберите действие из меню ниже\\."
    )

    keyboard = [
        [InlineKeyboardButton("📋 Прайс-лист", callback_data="price_list")],
        [InlineKeyboardButton("🛒 Заказать услугу", callback_data="order_service_start")],
        [InlineKeyboardButton("👤 Мой кабинет", callback_data="my_account")],
        [InlineKeyboardButton("💬 Связаться с админом", callback_data="contact_admin")],
    ]
    if await is_admin(user.id):
        keyboard.append([InlineKeyboardButton("👑 Админ-панель", callback_data="admin_panel")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(banner_text, reply_markup=reply_markup, parse_mode='MarkdownV2')
    else:
        await update.message.reply_text(banner_text, reply_markup=reply_markup, parse_mode='MarkdownV2')
    return STATE_MAIN_MENU

async def price_list(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    conn = get_db_connection()
    services = conn.execute("SELECT * FROM services WHERE is_active = 1").fetchall()
    conn.close()
    message_text = "*📋 НАШ ПРАЙС\\-ЛИСТ 📋*\n\n"
    for service in services:
        name = escape_markdown(service['name'], version=2)
        description = escape_markdown(service['description'], version=2)
        price_usd = escape_markdown(f"{service['price_usd']:.2f}", version=2)
        price_btc = escape_markdown(f"{service['price_btc']:.5f}", version=2)
        price_stars = escape_markdown(str(service['price_stars']), version=2)
        
        # Check if EUR and UAH prices exist before trying to access them
        try:
            price_eur = escape_markdown(f"{service['price_eur']:.2f}", version=2)
            price_uah = escape_markdown(f"{service['price_uah']:.2f}", version=2)
        except (KeyError, TypeError):
            price_eur = "N/A"
            price_uah = "N/A"

        message_text += (f"🔹 *{name}*\\: _{description}_\n"
                         f"   💵 USD: `{price_usd}`\n"
                         f"   ₿ BTC: `{price_btc}`\n"
                         f"   ⭐️ STARS: `{price_stars}`\n"
                         f"   💶 EUR: `{price_eur}`\n"
                         f"   ₴ UAH: `{price_uah}`\n\n")

    keyboard = [[InlineKeyboardButton("⬅️ Назад в меню", callback_data="main_menu")]]
    await query.edit_message_text(text=message_text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='MarkdownV2')
async def update_all_usernames(application: Application) -> None:
    """Обновляет username всех пользователей в базе при запуске бота."""
    logger.info("🔄 Updating user information...")
    conn = get_db_connection()
    cursor = conn.cursor()
    users = cursor.execute("SELECT user_id FROM users").fetchall()

    updated = 0
    for user in users:
        user_id = user['user_id']
        try:
            tg_user = await application.bot.get_chat(user_id)
            cursor.execute(
                "UPDATE users SET username = ?, first_name = ?, last_name = ? WHERE user_id = ?",
                (tg_user.username, tg_user.first_name, tg_user.last_name, user_id)
            )
            updated += 1
        except Exception as e:
            logger.warning(f"Не удалось обновить данные пользователя {user_id}: {e}")

    conn.commit()
    conn.close()
    logger.info(f"Usernames обновлены для {updated} пользователей.")
async def my_account(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    user_id = query.from_user.id
    await query.answer()
    conn = get_db_connection()
    orders = conn.execute("SELECT o.order_id, o.status, s.name FROM orders o JOIN services s ON o.service_id = s.service_id WHERE o.user_id = ? ORDER BY o.order_id DESC", (user_id,)).fetchall()
    conn.close()
    message_text = "*👤 ВАШИ ЗАКАЗЫ 👤*\n\n"
    if not orders:
        message_text += "_У вас пока нет заказов\\._"
    else:
        for order in orders:
            message_text += (f"📦 *Заказ \\#{order['order_id']}*\n"
                             f"   Услуга: _{escape_markdown(order['name'], version=2)}_\n"
                             f"   Статус: *{escape_markdown(order['status'], version=2)}*\n\n")

    keyboard = [[InlineKeyboardButton("⬅️ Назад в меню", callback_data="main_menu")]]
    await query.edit_message_text(text=message_text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='MarkdownV2')
    

async def cancel_flow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Generic cancellation function for returning to the main menu."""
    if update.callback_query:
        await update.callback_query.answer()
    await start(update, context)
    context.user_data.clear()
    return ConversationHandler.END

# --- ORDERING FLOW HANDLERS ---
async def order_service_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the ordering process by showing a list of services."""
    query = update.callback_query
    await query.answer()
    conn = get_db_connection()
    services = conn.execute("SELECT * FROM services WHERE is_active = 1").fetchall()
    conn.close()
    
    keyboard = [[InlineKeyboardButton(service['name'], callback_data=f"select_service_{service['service_id']}")] for service in services]
    keyboard.append([InlineKeyboardButton("⬅️ Отмена", callback_data="cancel_order")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text("Выберите услугу, которую хотите заказать:", reply_markup=reply_markup)
    return STATE_SELECTING_SERVICE

async def select_service(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the selected service and asks for a payment method."""
    query = update.callback_query
    await query.answer()
    
    service_id = int(query.data.split('_')[-1])
    context.user_data['service_id'] = service_id
    
    conn = get_db_connection()
    service = conn.execute("SELECT name, price_usd, price_btc, price_stars, price_eur, price_uah FROM services WHERE service_id = ?", (service_id,)).fetchone()
    conn.close()

    context.user_data['service_name'] = service['name']
    
    message_text = (f"Вы выбрали услугу: *{escape_markdown(service['name'], version=2)}*\n\n"
                    f"Цена:\n"
                    f"💵 USD: `{escape_markdown(f'{service['price_usd']:.2f}', version=2)}`\n"
                    f"₿ BTC: `{escape_markdown(f'{service['price_btc']:.5f}', version=2)}`\n"
                    f"⭐️ STARS: `{escape_markdown(str(service['price_stars']), version=2)}`\n"
                    f"💶 EUR: `{escape_markdown(f'{service['price_eur']:.2f}', version=2)}`\n"
                    f"₴ UAH: `{escape_markdown(f'{service['price_uah']:.2f}', version=2)}`\n\n"
                    "Выберите способ оплаты:")

    keyboard = [
        [InlineKeyboardButton("💵 USD", callback_data="pay_usd")],
        [InlineKeyboardButton("₿ BTC", callback_data="pay_btc")],
        [InlineKeyboardButton("⭐️ TG Stars", callback_data="pay_stars")],
        [InlineKeyboardButton("💶 EUR", callback_data="pay_eur")],
        [InlineKeyboardButton("₴ UAH", callback_data="pay_uah")],
        [InlineKeyboardButton("⬅️ Отмена", callback_data="cancel_order")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message_text, reply_markup=reply_markup, parse_mode='MarkdownV2')
    return STATE_SELECTING_PAYMENT

async def select_payment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Shows payment details and asks for proof."""
    query = update.callback_query
    await query.answer()
    
    payment_method = query.data.split('_')[-1]
    context.user_data['payment_method'] = payment_method
    
    wallet_info = ""
    if payment_method == 'usd':
        safe_wallet = escape_markdown(PAYMENT_WALLET_USD, version=2)
        wallet_info = f"Переведите средства на TON\\-кошелек: `{safe_wallet}`"
    elif payment_method == 'btc':
        safe_wallet = escape_markdown(PAYMENT_WALLET_BTC, version=2)
        wallet_info = f"Переведите средства на BTC\\-кошелек: `{safe_wallet}`"
    elif payment_method == 'eur':
        safe_wallet = escape_markdown(PAYMENT_WALLET_EUR, version=2)
        wallet_info = f"Переведите средства на EUR\\-кошелек: `{safe_wallet}`"
    elif payment_method == 'uah':
        safe_wallet = escape_markdown(PAYMENT_WALLET_UAH, version=2)
        wallet_info = f"Переведите средства на UAH\\-кошелек: `{safe_wallet}`"
    elif payment_method == 'stars':
        wallet_info = "Оплата TG Stars будет обработана администратором вручную\\."

    message_text = (f"Вы выбрали оплату в *{payment_method.upper()}*\\.\n\n"
                    f"{wallet_info}\n\n"
                    "После оплаты, пожалуйста, отправьте скриншот или фото чека\\.\n"
                    "Для отмены введите /cancel\\.")
    
    await query.edit_message_text(message_text, parse_mode='MarkdownV2')
    return STATE_UPLOADING_PROOF

async def upload_payment_proof(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user = update.effective_user
    service_id = context.user_data.get('service_id')
    service_name = context.user_data.get('service_name')
    payment_method = context.user_data.get('payment_method')
    
    if not service_id or not service_name or not payment_method:
        await update.message.reply_text(
            "Произошла ошибка с вашим заказом. Пожалуйста, начните сначала.",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ В главное меню", callback_data="main_menu")]])
        )
        context.user_data.clear()
        return STATE_MAIN_MENU
        
    if not update.message.photo and not update.message.document:
        await update.message.reply_text("📎 Пришлите фото или документ (pdf, скриншот) с чеком.")
        return STATE_UPLOADING_PROOF
        
    file_id, file_type = None, None
    if update.message.photo:
        file_id = update.message.photo[-1].file_id
        file_type = "photo"
    elif update.message.document:
        file_id = update.message.document.file_id
        file_type = update.message.document.mime_type
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO orders (user_id, service_id, payment_method, creation_date) VALUES (?, ?, ?, ?)",
        (user.id, service_id, payment_method, datetime.datetime.now().isoformat())
    )
    new_order_id = cursor.lastrowid
    
    cursor.execute(
        "INSERT INTO payment_proofs (order_id, file_id, file_type, upload_date) VALUES (?, ?, ?, ?)",
        (new_order_id, file_id, file_type, datetime.datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

    await update.message.reply_text(
        f"Ваш заказ \\#{new_order_id} на услугу '{escape_markdown(service_name, version=2)}' принят\\.\n"
        f"Ожидайте, пока администратор проверит оплату\\.",
        parse_mode='MarkdownV2'
    )
    
    admin_message_text = (f"📦 *НОВЫЙ ЗАКАЗ \\#{new_order_id}*\n\n"
                          f"👤 Пользователь: {get_user_mention(user)}\n"
                          f"🔹 Услуга: _{escape_markdown(service_name, version=2)}_\n"
                          f"💸 Метод оплаты: *{payment_method.upper()}*\n\n"
                          "Ожидает подтверждения\\.")
                          
    keyboard = [[
        InlineKeyboardButton("✅ Одобрить", callback_data=f"approve_proof_{new_order_id}"),
        InlineKeyboardButton("❌ Отклонить", callback_data=f"reject_proof_{new_order_id}")
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if file_type == "photo":
        await context.bot.send_photo(
            chat_id=ADMIN_CHAT_ID,
            photo=file_id,
            caption=admin_message_text,
            reply_markup=reply_markup,
            parse_mode='MarkdownV2'
        )
    else:
        await context.bot.send_document(
            chat_id=ADMIN_CHAT_ID,
            document=file_id,
            caption=admin_message_text,
            reply_markup=reply_markup,
            parse_mode='MarkdownV2'
        )
    
    context.user_data.clear()
    return ConversationHandler.END

async def admin_handle_proof(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    action, _, order_id = query.data.partition("_proof_")
    order_id = int(order_id)

    conn = get_db_connection()
    cursor = conn.cursor()

    status = "approved" if action == "approve" else "rejected"
    cursor.execute(
        "UPDATE payment_proofs SET status = ? WHERE order_id = ? ORDER BY proof_id DESC LIMIT 1",
        (status, order_id)
    )
    conn.commit()
    conn.close()

    result_text = "✅ Чек одобрен" if status == "approved" else "❌ Чек отклонён"
    await query.edit_message_caption(query.message.caption + f"\n\n{result_text}")
# --- HANDLERS FOR CHAT WITH ADMIN ---
async def start_admin_chat(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Начинает диалог пользователя с администратором."""
    query = update.callback_query
    await query.answer()
    
    keyboard = [[InlineKeyboardButton("⬅️ Выйти из чата", callback_data="main_menu")]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    message_text = "💬 *Вы начали диалог с администратором\\.*\n" \
                   "Все ваши сообщения будут перенаправлены ему\\.\n" \
                   "Для завершения чата нажмите на кнопку ниже или отправьте /cancel\\."
    
    await query.edit_message_text(message_text, reply_markup=reply_markup, parse_mode='MarkdownV2')
    
    return STATE_USER_TO_ADMIN_CHAT

async def handle_user_to_admin_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Перенаправляет сообщения от пользователя администратору."""
    user = update.effective_user
    
    # Сначала пытаемся переслать сообщение. Это главное действие.
    try:
        await update.message.forward(chat_id=ADMIN_CHAT_ID)
    except telegram.error.TelegramError as e:
        logger.error(f"Failed to forward user message to admin: {e}")
        await update.message.reply_text("❌ Произошла ошибка при пересылке вашего сообщения. Пожалуйста, попробуйте позже.")
        return STATE_USER_TO_ADMIN_CHAT

    # Если пересылка удалась, отправляем уведомление администратору.
    # Если Markdown не сработает, пробуем отправить простое сообщение.
    try:
        admin_mention_text = f"⬆️ _Сообщение от пользователя {get_user_mention(user)}._"
        await context.bot.send_message(
            chat_id=ADMIN_CHAT_ID,
            text=admin_mention_text,
            parse_mode='MarkdownV2'
        )
    except telegram.error.TelegramError as e:
        logger.warning(f"Failed to send Markdown mention to admin: {e}. Sending without mention.")
        await context.bot.send_message(
            chat_id=ADMIN_CHAT_ID,
            text=f"⬆️ _Сообщение от пользователя {user.first_name} (ID: {user.id})_."
        )

    # И наконец, отправляем пользователю подтверждение, что всё в порядке.
    try:
        await update.message.reply_text("✅ Ваше сообщение отправлено администратору. Ожидайте ответа.")
    except telegram.error.TelegramError as e:
        logger.error(f"Failed to send confirmation to user {user.id}: {e}")

    return STATE_USER_TO_ADMIN_CHAT


async def handle_admin_reply(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Перенаправляет ответы администратора пользователю."""
    if update.message.reply_to_message and update.message.reply_to_message.forward_from:
        user_id = update.message.reply_to_message.forward_from.id
        
        try:
            await context.bot.send_message(
                chat_id=user_id,
                text=f"✉️ *Ответ от администратора:*\n\n{escape_markdown(update.message.text, version=2)}",
                parse_mode='MarkdownV2'
            )
            await update.message.reply_text("✅ Ваш ответ отправлен пользователю.")
        except telegram.error.TelegramError as e:
            logger.error(f"Failed to send message to user {user_id}: {e}")
            await update.message.reply_text("❌ Не удалось отправить ответ пользователю. Возможно, он заблокировал бота.")


# --- ADMIN PANEL HANDLERS ---
async def admin_panel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Displays the main admin control panel."""
    query = update.callback_query
    if not await is_admin(query.from_user.id):
        await query.answer("Access Denied.", show_alert=True)
        return STATE_MAIN_MENU

    await query.answer()
    keyboard = [
        [InlineKeyboardButton("📊 Статистика", callback_data="admin_stats")],
        [InlineKeyboardButton("👥 Пользователи", callback_data="admin_users_list")],
        [InlineKeyboardButton("📦 Все Заказы", callback_data="admin_orders_list")],
        [InlineKeyboardButton("🛠️ Управление Админами", callback_data="admin_manage_admins")],
        [InlineKeyboardButton("🔧 Управление услугами", callback_data="admin_manage_services")],
        [InlineKeyboardButton("📢 Рассылка", callback_data="admin_broadcast_start")],
        [InlineKeyboardButton("⬅️ Назад в меню", callback_data="main_menu")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text("👑 *Админ\\-панель*", reply_markup=reply_markup, parse_mode='MarkdownV2')
    return STATE_MAIN_MENU

async def admin_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Displays bot statistics."""
    query = update.callback_query
    await query.answer()
    conn = get_db_connection()
    user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    order_count = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    conn.close()
    
    text = (f"📊 *Статистика Бота*\n\n"
            f"👥 Всего пользователей: *{user_count}*\n"
            f"📦 Всего заказов: *{order_count}*")
    
    keyboard = [[InlineKeyboardButton("⬅️ Назад в админку", callback_data="admin_panel")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode='MarkdownV2')
    return STATE_MAIN_MENU

async def admin_users_list(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Displays a list of users with ban/unban options."""
    query = update.callback_query
    await query.answer()
    conn = get_db_connection()
    users = conn.execute("SELECT user_id, first_name, username, status FROM users").fetchall()
    conn.close()
    
    text = "*👥 Список Пользователей*\n\n"
    for user in users:
        mention = get_user_mention(user)
        status_emoji = "✅" if user['status'] == 'active' else "🚫"
        text += f"{status_emoji} {mention} \\(ID: `{user['user_id']}`\\) \\- Статус: *{user['status']}*\n"
    
    keyboard = [[InlineKeyboardButton("⬅️ Назад в админку", callback_data="admin_panel")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode='MarkdownV2')
    return STATE_MAIN_MENU

async def admin_reject_proof_with_comment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['rejecting_order'] = int(update.callback_query.data.split("_")[-1])
    await update.callback_query.edit_message_text("Введите причину отклонения:")
    return STATE_ADMIN_REJECT_PROOF

async def save_reject_comment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    order_id = context.user_data.pop('rejecting_order')
    comment = update.message.text

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE payment_proofs
        SET status = ?, admin_comment = ?
        WHERE order_id = ?
        ORDER BY proof_id DESC LIMIT 1
    """, ("rejected", comment, order_id))
    conn.commit()
    conn.close()

    await update.message.reply_text(f"❌ Чек по заказу #{order_id} отклонён.\nПричина: {comment}")
    return ConversationHandler.END

async def admin_orders_list(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Displays a list of all orders."""
    query = update.callback_query
    await query.answer()
    conn = get_db_connection()
    orders = conn.execute("""
        SELECT o.order_id, o.status, u.user_id, u.first_name, s.name as service_name
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        JOIN services s ON o.service_id = s.service_id
        ORDER BY o.order_id DESC
    """).fetchall()
    conn.close()

    text = "*📦 Список Всех Заказов*\n\n"
    if not orders:
        text += "_Заказов пока нет\\._"
    else:
        for order in orders:
            mention = get_user_mention(order)
            text += (f"🔹 *Заказ `#{order['order_id']}`* от {mention}\n"
                     f"   Услуга: _{escape_markdown(order['service_name'], version=2)}_\n"
                     f"   Статус: *{escape_markdown(order['status'], version=2)}*\n\n")

    keyboard = [[InlineKeyboardButton("⬅️ Назад в админку", callback_data="admin_panel")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode='MarkdownV2')
    return STATE_MAIN_MENU

# --- ADMIN MANAGEMENT HANDLERS ---
async def admin_manage_admins(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Shows the admin management menu."""
    query = update.callback_query
    await query.answer()
    
    keyboard = [
        [InlineKeyboardButton("➕ Добавить Администратора", callback_data="admin_add_start")],
        [InlineKeyboardButton("➖ Удалить Администратора", callback_data="admin_remove_start")],
        [InlineKeyboardButton("⬅️ Назад в админку", callback_data="admin_panel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text("🛠️ *Управление Администраторами*", reply_markup=reply_markup, parse_mode='MarkdownV2')
    return STATE_MAIN_MENU

async def admin_add_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the conversation to add a new admin."""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        "Введите *Telegram User ID* пользователя, которого хотите сделать администратором\\.\n"
        "Чтобы отменить, введите /cancel\\.",
        parse_mode='MarkdownV2'
    )
    return STATE_ADMIN_ADD_ID

async def admin_add_receive_id(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receives the User ID and makes the user an admin."""
    try:
        user_id_to_add = int(update.message.text)
    except (ValueError, TypeError):
        await update.message.reply_text("Пожалуйста, введите корректный числовой ID\\.")
        return STATE_ADMIN_ADD_ID

    conn = get_db_connection()
    user_exists = conn.execute("SELECT 1 FROM users WHERE user_id = ?", (user_id_to_add,)).fetchone()
    if not user_exists:
        await update.message.reply_text("Пользователь с таким ID не найден в базе данных бота\\. Он должен сначала запустить /start\\.")
        conn.close()
        return STATE_ADMIN_ADD_ID
        
    is_already_admin = conn.execute("SELECT 1 FROM admins WHERE user_id = ?", (user_id_to_add,)).fetchone()
    if is_already_admin:
        await update.message.reply_text("Этот пользователь уже является администратором\\.")
        conn.close()
        await start(update, context) 
        return ConversationHandler.END

    conn.execute("INSERT INTO admins (user_id) VALUES (?)", (user_id_to_add,))
    conn.commit()
    conn.close()
    await update.message.reply_text(f"✅ Пользователь с ID `{user_id_to_add}` успешно назначен администратором\\.")
    await start(update, context)
    return ConversationHandler.END

async def admin_remove_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the conversation to remove an admin."""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        "Введите *Telegram User ID* пользователя, которого хотите удалить из списка администраторов\\.\n"
        "Чтобы отменить, введите /cancel\\.",
        parse_mode='MarkdownV2'
    )
    return STATE_ADMIN_REMOVE_ID

async def admin_remove_receive_id(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receives the User ID and removes the user from admins."""
    try:
        user_id_to_remove = int(update.message.text)
    except (ValueError, TypeError):
        await update.message.reply_text("Пожалуйста, введите корректный числовой ID\\.")
        return STATE_ADMIN_REMOVE_ID

    if user_id_to_remove == INITIAL_ADMIN_ID:
        await update.message.reply_text("Нельзя удалить из администраторов первого администратора\\.")
        await start(update, context) 
        return ConversationHandler.END
        
    conn = get_db_connection()
    is_already_admin = conn.execute("SELECT 1 FROM admins WHERE user_id = ?", (user_id_to_remove,)).fetchone()
    if not is_already_admin:
        await update.message.reply_text("Этот пользователь не является администратором\\.")
        conn.close()
        await start(update, context) 
        return ConversationHandler.END
    
    conn.execute("DELETE FROM admins WHERE user_id = ?", (user_id_to_remove,))
    conn.commit()
    conn.close()
    await update.message.reply_text(f"✅ Пользователь с ID `{user_id_to_remove}` успешно удален из администраторов\\.")
    await start(update, context)
    return ConversationHandler.END

# --- BROADCAST HANDLERS ---
async def admin_broadcast_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the broadcast conversation."""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        "Введите сообщение, которое хотите отправить всем пользователям\\.\n"
        "Поддерживается MarkdownV2 форматирование\\. Для отмены введите /cancel\\.",
        parse_mode='MarkdownV2'
    )
    return STATE_ADMIN_BROADCAST_MESSAGE
    
async def admin_broadcast_receive_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receives and broadcasts the message to all users."""
    message_text = update.message.text_markdown_v2
    admin_id = update.effective_user.id
    
    await update.message.reply_text("Начинаю рассылку\\. Это может занять некоторое время\\.")
    
    conn = get_db_connection()
    users = conn.execute("SELECT user_id FROM users WHERE status = 'active'").fetchall()
    conn.close()
    
    success_count = 0
    fail_count = 0
    
    for user in users:
        if user['user_id'] == admin_id:
            continue
        try:
            await context.bot.send_message(chat_id=user['user_id'], text=message_text, parse_mode='MarkdownV2')
            success_count += 1
            await asyncio.sleep(0.1) # Avoid hitting rate limits
        except telegram.error.TelegramError as e:
            fail_count += 1
            logger.warning(f"Could not send broadcast message to {user['user_id']}: {e}")
            
    summary_text = (f"📢 *Рассылка завершена\\!*\n\n"
                    f"✅ Успешно отправлено: *{success_count}*\n"
                    f"❌ Не удалось отправить: *{fail_count}*")
    await update.message.reply_text(summary_text, parse_mode='MarkdownV2')
    
    await start(update, context)
    return ConversationHandler.END

# --- SERVICES MANAGEMENT HANDLERS ---
async def admin_manage_services(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Shows the service management menu."""
    query = update.callback_query
    await query.answer()

    conn = get_db_connection()
    services = conn.execute("SELECT service_id, name, is_active FROM services").fetchall()
    conn.close()

    text = "*🔧 Управление услугами*\n\n"
    if not services:
        text += "_Услуги пока не добавлены\\._"
    else:
        for service in services:
            status = "✅" if service['is_active'] else "🚫"
            text += f"{status} `{service['service_id']}`: {escape_markdown(service['name'], version=2)}\n"

    keyboard = [
        [InlineKeyboardButton("➕ Добавить услугу", callback_data="admin_add_service")],
        [InlineKeyboardButton("✏️ Изменить услугу", callback_data="admin_edit_service_select")],
        [InlineKeyboardButton("❌ Удалить услугу", callback_data="admin_delete_service_start")],
        [InlineKeyboardButton("⬅️ Назад в админку", callback_data="admin_panel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode='MarkdownV2')
    return STATE_MAIN_MENU

async def admin_add_service_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the conversation to add a new service."""
    query = update.callback_query
    await query.answer()
    context.user_data['service_data'] = {}
    await query.edit_message_text(
        "Введите данные для новой услуги в формате:\n\n"
        "Название\n"
        "Описание\n"
        "Цена в USD\n"
        "Цена в BTC\n"
        "Цена в STARS\n"
        "Цена в EUR\n"
        "Цена в UAH\n\n"
        "Пример:\n"
        "Разблокировка\n"
        "Разблокировка загрузчика\n"
        "20.0\n"
        "0.0002\n"
        "2000\n"
        "18.0\n"
        "750.0\n\n"
        "Для отмены введите /cancel\\.",
        # Ensure database is properly set up
        parse_mode='MarkdownV2'
    )
    return STATE_ADMIN_ADD_SERVICE

async def admin_add_service_receive_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receives service data and adds a new service to the database."""
    try:
        data = update.message.text.split('\n')
        if len(data) != 7:
            # Enhanced services with better pricing

        name, description, price_usd_str, price_btc_str, price_stars_str, price_eur_str, price_uah_str = data
        price_usd = float(price_usd_str)
        price_btc = float(price_btc_str)
        price_stars = int(price_stars_str)
        price_eur = float(price_eur_str)
        price_uah = float(price_uah_str)

        conn = get_db_connection()
        conn.execute("INSERT INTO services (name, description, price_usd, price_btc, price_stars, price_eur, price_uah) VALUES (?, ?, ?, ?, ?, ?, ?)",
                     (name, description, price_usd, price_btc, price_stars, price_eur, price_uah))
            
        conn.commit()
        conn.close()
        logger.info("✅ Database setup completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Database setup failed: {e}")
        raise
        
        await update.message.reply_text("✅ Услуга успешно добавлена\\!")
    except (ValueError, IndexError) as e:
        await update.message.reply_text(f"❌ Произошла ошибка: {e}\\. Пожалуйста, введите данные в правильном формате\\.")
        return STATE_ADMIN_ADD_SERVICE
    except sqlite3.IntegrityError:
        await update.message.reply_text("❌ Услуга с таким названием уже существует\\.")
        return STATE_ADMIN_ADD_SERVICE
        
    await start(update, context)
    return ConversationHandler.END

async def admin_delete_service_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the conversation to delete a service."""
    query = update.callback_query
    await query.answer()
    
    conn = get_db_connection()
    services = conn.execute("SELECT service_id, name FROM services").fetchall()
    conn.close()
    
    if not services:
        await query.edit_message_text("❌ Нет услуг для удаления\\.")
        return STATE_MAIN_MENU
        
    text = "*❌ Удаление услуги*\n\nВведите ID услуги, которую хотите удалить\\.\n\n"
    for service in services:
        text += f"`{service['service_id']}`: {escape_markdown(service['name'], version=2)}\n"
    text += "\nДля отмены введите /cancel\\."
    
    await query.edit_message_text(text, parse_mode='MarkdownV2')
    return STATE_ADMIN_MANAGE_SERVICES

async def admin_delete_service_confirm(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Confirms and deletes the service."""
    try:
        service_id_to_delete = int(update.message.text)
    except (ValueError, TypeError):
        await update.message.reply_text("Пожалуйста, введите корректный числовой ID\\.")
        return STATE_ADMIN_MANAGE_SERVICES
        
    conn = get_db_connection()
    service = conn.execute("SELECT name FROM services WHERE service_id = ?", (service_id_to_delete,)).fetchone()
    if not service:
        await update.message.reply_text(f"❌ Услуга с ID `{service_id_to_delete}` не найдена\\.")
        conn.close()
        return STATE_ADMIN_MANAGE_SERVICES
        
    conn.execute("DELETE FROM services WHERE service_id = ?", (service_id_to_delete,))
    conn.commit()
    conn.close()
    
    await update.message.reply_text(f"✅ Услуга `{service['name']}` успешно удалена\\.")
    await start(update, context)
    return STATE_MAIN_MENU

def main() -> None:
    """The main function to set up and run the bot."""
    logger.info("🤖 Starting Rootzsu Telegram Bot...")
    
    # Setup signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Setup database
        setup_database(initial_admin_id=INITIAL_ADMIN_ID)
        
        # Create the application
        application = Application.builder().token(BOT_TOKEN).build()
        
        # Update status file
        update_status_file()

        # ConversationHandler for the entire bot
        conv_handler = ConversationHandler(
            entry_points=[CommandHandler("start", start)],
            states={
                STATE_MAIN_MENU: [
                    CallbackQueryHandler(start, pattern="^main_menu$"),
                    CallbackQueryHandler(price_list, pattern="^price_list$"),
                    CallbackQueryHandler(my_account, pattern="^my_account$"),
                    CallbackQueryHandler(order_service_start, pattern="^order_service_start$"),
                    CallbackQueryHandler(start_admin_chat, pattern="^contact_admin$"),
                    CallbackQueryHandler(admin_panel, pattern="^admin_panel$"),
                    CallbackQueryHandler(admin_stats, pattern="^admin_stats$"),
                    CallbackQueryHandler(admin_users_list, pattern="^admin_users_list$"),
                    CallbackQueryHandler(admin_orders_list, pattern="^admin_orders_list$"),
                    CallbackQueryHandler(admin_manage_services, pattern="^admin_manage_services$"),
                    CallbackQueryHandler(admin_add_service_start, pattern="^admin_add_service$"),
                    CallbackQueryHandler(admin_delete_service_start, pattern="^admin_delete_service_start$"),
                    CallbackQueryHandler(admin_manage_admins, pattern="^admin_manage_admins$"),
                    CallbackQueryHandler(admin_add_start, pattern="^admin_add_start$"),
                    CallbackQueryHandler(admin_remove_start, pattern="^admin_remove_start$"),
                    CallbackQueryHandler(admin_broadcast_start, pattern="^admin_broadcast_start$"),
                    # Admin action for rejecting a proof, which starts a new state
                    CallbackQueryHandler(admin_reject_proof_with_comment, pattern="^reject_proof_")
                ],
                STATE_SELECTING_SERVICE: [
                    CallbackQueryHandler(select_service, pattern="^select_service_"),
                    CallbackQueryHandler(cancel_flow, pattern="^cancel_order$")
                ],
                STATE_SELECTING_PAYMENT: [
                    CallbackQueryHandler(select_payment, pattern="^pay_"),
                    CallbackQueryHandler(cancel_flow, pattern="^cancel_order$")
                ],
                STATE_UPLOADING_PROOF: [
                    MessageHandler(filters.PHOTO | filters.Document.ALL & ~filters.COMMAND, upload_payment_proof),
                    CommandHandler("cancel", cancel_flow)
                ],
                STATE_USER_TO_ADMIN_CHAT: [
                    MessageHandler(filters.TEXT & ~filters.COMMAND, handle_user_to_admin_message),
                    CallbackQueryHandler(cancel_flow, pattern="^main_menu$")
                ],
                STATE_ADMIN_ADD_ID: [
                    MessageHandler(filters.TEXT & ~filters.COMMAND, admin_add_receive_id),
                    CommandHandler("cancel", cancel_flow)
                ],
                STATE_ADMIN_REMOVE_ID: [
                    MessageHandler(filters.TEXT & ~filters.COMMAND, admin_remove_receive_id),
                    CommandHandler("cancel", cancel_flow)
                ],
                STATE_ADMIN_BROADCAST_MESSAGE: [  # Corrected state name
                    MessageHandler(filters.TEXT & ~filters.COMMAND, admin_broadcast_receive_message),
                    CommandHandler("cancel", cancel_flow)
                ],
                STATE_ADMIN_REJECT_PROOF: [ # Added handler for rejecting proof
                    MessageHandler(filters.TEXT & ~filters.COMMAND, save_reject_comment),
                    CommandHandler("cancel", cancel_flow)
                ],
            },
            fallbacks=[CommandHandler("start", start), CommandHandler("cancel", cancel_flow)],
        )

        # Register the ConversationHandler
        application.add_handler(conv_handler)
        
        # Register the admin reply handler, which should work outside the conversation
        application.add_handler(MessageHandler(filters.REPLY & filters.User(ADMIN_CHAT_ID) & filters.TEXT, handle_admin_reply))

        # Schedule the username update task
        application.job_queue.run_once(
            lambda ctx: update_all_usernames(application),
            when=1
        )
        
        # Schedule periodic status updates
        application.job_queue.run_repeating(
            lambda ctx: update_status_file(),
            interval=30,  # Update every 30 seconds
            first=10
        )

        logger.info("✅ Bot setup completed, starting polling...")
        
        # Start the bot
        application.run_polling(
            drop_pending_updates=True,
            allowed_updates=Update.ALL_TYPES
        )
        
    except Exception as e:
        logger.error(f"❌ Bot startup failed: {e}")
        cleanup_on_exit()
        sys.exit(1)
    finally:
        cleanup_on_exit()


if __name__ == "__main__":
    logger.info("🚀 Rootzsu Bot starting...")
    main()
