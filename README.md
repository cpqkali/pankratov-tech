# Rootzsu Services Platform

Профессиональная платформа IT-услуг с Telegram-ботом и веб-интерфейсом.

## 🚀 Возможности

- **Веб-платформа**: Современный интерфейс для заказа услуг
- **Telegram-бот**: Автоматизированная система заказов и поддержки
- **Система оплаты**: Поддержка USD, EUR, UAH, BTC и Telegram Stars
- **AI-ассистент**: Интеграция с Google Gemini для технической поддержки
- **Админ-панель**: Полное управление заказами и пользователями
- **Многоязычность**: Поддержка русского, украинского, казахского и английского

## 🛠 Технологии

- **Backend**: Python 3.11, Flask, SQLite
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Bot**: python-telegram-bot
- **AI**: Google Generative AI (Gemini)
- **Hosting**: Render (оптимизировано)

## 📦 Установка и запуск

### Локальная разработка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd rootzsu-site
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Создайте файл `.env` с переменными окружения:
```env
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_secret_key
```

4. Запустите приложение:
```bash
# Запуск веб-сервера
python server.py

# Запуск бота (в отдельном терминале)
python bot.py

# Или используйте менеджер процессов
python start.py
```

### Деплой на Render

1. Подключите репозиторий к Render
2. Создайте Web Service с настройками:
   - **Build Command**: `pip install -r requirements.txt && mkdir -p logs`
   - **Start Command**: `python server.py`
   - **Environment**: Python 3.11

3. Создайте Background Worker для бота:
   - **Build Command**: `pip install -r requirements.txt && mkdir -p logs`
   - **Start Command**: `python bot.py`

4. Добавьте переменные окружения:
   - `GEMINI_API_KEY`: Ваш API ключ Google Gemini
   - `SECRET_KEY`: Секретный ключ для Flask

## 🔧 Конфигурация

### Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Обновите `BOT_TOKEN` в `bot.py`
4. Обновите `INITIAL_ADMIN_ID` на ваш Telegram ID

### Google Gemini AI

1. Получите API ключ в [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Добавьте ключ в переменные окружения как `GEMINI_API_KEY`

### Google OAuth

1. Настройте OAuth в [Google Cloud Console](https://console.cloud.google.com/)
2. Обновите `GOOGLE_CLIENT_ID` в `server.py`

## 📁 Структура проекта

```
rootzsu-site/
├── server.py              # Flask веб-сервер
├── bot.py                 # Telegram бот
├── start.py               # Менеджер процессов
├── requirements.txt       # Python зависимости
├── Procfile              # Конфигурация для Heroku
├── render.yaml           # Конфигурация для Render
├── public/               # Статические файлы
│   ├── index.html        # Главная страница
│   ├── css/              # Стили
│   ├── js/               # JavaScript
│   └── pages/            # Дополнительные страницы
├── logs/                 # Логи приложения
└── README.md             # Документация
```

## 🎯 Основные функции

### Веб-платформа
- Каталог услуг с детальным описанием
- Система заказов с множественными способами оплаты
- Личный кабинет пользователя
- AI-чат для технической поддержки
- Адаптивный дизайн для всех устройств

### Telegram Bot
- Интерактивное меню услуг
- Система заказов с загрузкой чеков
- Админ-панель для управления
- Автоматические уведомления
- Поддержка множественных языков

### Админ-панель
- Управление пользователями и заказами
- Статистика и аналитика
- Система рассылок
- Управление услугами и ценами
- Модерация платежей

## 🔒 Безопасность

- Аутентификация через Google OAuth
- Защищенные API endpoints
- Валидация всех пользовательских данных
- Логирование всех операций
- Защита от CSRF и XSS атак

## 📊 Мониторинг

- Health check endpoints (`/health`)
- Системная статистика (`/api/status`)
- Логирование в файлы и консоль
- Автоматический перезапуск процессов

## 🌐 API Endpoints

### Основные
- `GET /` - Главная страница
- `GET /health` - Проверка здоровья системы
- `GET /api/status` - Статус системы

### Аутентификация
- `POST /api/auth/google` - Вход через Google

### Услуги
- `GET /api/services` - Список услуг
- `POST /api/orders` - Создание заказа

### AI Chat
- `POST /api/gemini/chat` - Чат с AI

## 🤝 Поддержка

- **Telegram**: [@rootzsu](https://t.me/rootzsu)
- **GitHub**: [cpqkali](https://github.com/cpqkali)
- **Email**: support@rootzsu.com

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.

---

**Rootzsu Services** - Профессиональные IT-услуги и техническая поддержка 24/7