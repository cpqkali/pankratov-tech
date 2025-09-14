# Phantom Services Platform

Профессиональная платформа IT-услуг с современным веб-интерфейсом и Telegram-ботом.

## 🚀 Возможности

- **Современный веб-интерфейс**: SPA с роутингом и анимациями
- **Система аутентификации**: Google OAuth2 и email/пароль
- **Многовалютная оплата**: UAH, TON, USDT (TRC20)
- **Личный кабинет**: Заказы, скачивания, чат с админом
- **Админ-панель**: Полное управление контентом и пользователями
- **Telegram-бот**: Автоматизированная система заказов
- **Летающие частицы**: Интерактивная анимация фона

## 🛠 Технологии

- **Backend**: Python 3.11, Flask, SQLite
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Анимации**: CSS3 + Canvas API
- **Аутентификация**: Google OAuth2, JWT
- **Файлы**: Загрузка аватаров и скриншотов оплаты

## 📦 Установка и запуск

### Локальная разработка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd phantom-services
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Создайте файл `.env` с переменными окружения:
```env
SECRET_KEY=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
```

4. Запустите приложение:
```bash
# Запуск веб-сервера
python server.py

# Запуск бота (в отдельном терминале)
python bot.py
```

### Деплой на Render

1. Подключите репозиторий к Render
2. Создайте Web Service с настройками:
   - **Build Command**: `pip install -r requirements.txt && mkdir -p logs uploads static/images`
   - **Start Command**: `python server.py`
   - **Environment**: Python 3.11

3. Добавьте переменные окружения:
   - `SECRET_KEY`: Секретный ключ для Flask
   - `GOOGLE_CLIENT_ID`: ID клиента Google OAuth

## 🔧 Конфигурация

### Админ доступ

Админ панель доступна для следующих аккаунтов:

**Через сайт:**
- Email: `admin_phantom2000@phantom.com`
- Пароль: `phandmin2000_pwd`

**Через Google OAuth:**
- Email: `aishchnko12@gmail.com`

### Криптовалютные кошельки

Обновите адреса кошельков в `server.py`:

```python
CRYPTO_WALLETS = {
    'uah': '4149 6090 1876 9549',  # PrivatBank card
    'ton': 'UQCKtm0RoDtPCyObq18G-FKehsDPaVIiVX5Z8q78P_XfmTUh',
    'usdt': 'TYourUSDTAddressHere'  # Замените на ваш USDT TRC20 адрес
}
```

## 📁 Структура проекта

```
phantom-services/
├── server.py              # Flask веб-сервер
├── bot.py                 # Telegram бот
├── index.html             # Главная страница (SPA)
├── requirements.txt       # Python зависимости
├── static/                # Статические файлы
│   ├── css/
│   │   ├── style.css      # Основные стили
│   │   └── admin.css      # Стили админ панели
│   ├── js/
│   │   ├── main.js        # Основная логика
│   │   ├── router.js      # Клиентский роутер
│   │   ├── auth.js        # Система аутентификации
│   │   ├── particles.js   # Система частиц
│   │   ├── api.js         # API клиент
│   │   └── utils.js       # Утилиты
│   └── images/            # Изображения
├── uploads/               # Загруженные файлы
└── logs/                  # Логи приложения
```

## 🎯 Основные функции

### Веб-платформа
- SPA с клиентским роутингом
- Адаптивный дизайн для всех устройств
- Интерактивные анимации и частицы
- Система заказов с множественными способами оплаты
- Личный кабинет с чатом и историей

### Личный кабинет
- Управление профилем и аватаром
- История заказов и скачиваний
- Чат с администратором в реальном времени
- Уведомления о статусе заказов

### Админ-панель
- Управление пользователями и заказами
- Добавление/редактирование программ и новостей
- Статистика и аналитика
- Модерация платежей и чатов

## 🔒 Безопасность

- JWT токены для аутентификации
- Google OAuth2 интеграция
- Валидация всех пользовательских данных
- Защищенные админ эндпоинты
- Безопасная загрузка файлов

## 🌐 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/google` - Вход через Google
- `GET /api/auth/me` - Текущий пользователь
- `POST /api/auth/logout` - Выход

### Услуги и заказы
- `GET /api/services` - Список услуг
- `POST /api/orders` - Создание заказа
- `GET /api/orders` - Заказы пользователя

### Программы и новости
- `GET /api/programs` - Список программ
- `GET /api/news` - Список новостей

### Админ панель
- `GET /api/admin/stats` - Статистика
- `GET /api/admin/orders` - Все заказы
- `POST /api/admin/orders/{id}/approve` - Одобрить заказ
- `POST /api/admin/orders/{id}/reject` - Отклонить заказ

## 🤝 Поддержка

- **Telegram**: [@rootzsu](https://t.me/rootzsu)
- **GitHub**: [cpqkali](https://github.com/cpqkali)
- **Email**: admin@phantom.services

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.

---

**Phantom Services** - Профессиональные IT-услуги нового поколения 👻