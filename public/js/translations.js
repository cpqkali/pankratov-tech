// Translations for multiple languages
const translations = {
    ru: {
        // Navigation
        nav_home: "Главная",
        nav_services: "Услуги", 
        nav_team: "Команда",
        nav_cabinet: "Кабинет",
        nav_status: "Статус",
        nav_admin: "Админ",
        nav_support: "Поддержка",
        nav_service_details: "Описание услуг",
        
        // Header
        settings: "Настройки",
        
        // Home page
        welcome_title: "Добро пожаловать в ROOTZSU",
        welcome_subtitle: "Профессиональные IT-услуги и техническая поддержка",
        hero_description: "Мы предоставляем высококачественные услуги по настройке устройств, установке ПО и технической поддержке. Наша команда экспертов готова решить любые технические задачи с мобильными устройствами и компьютерами.",
        get_started: "Начать работу",
        learn_more: "Узнать больше",
        
        // About section
        about_title: "О нашей компании",
        about_description: "ROOTZSU - это команда профессионалов с многолетним опытом в области мобильных технологий и системного администрирования. Мы специализируемся на разблокировке загрузчиков, установке кастомных прошивок, восстановлении устройств и решении сложных технических задач.",
        why_choose_us: "Почему выбирают нас",
        experience_years: "Лет опыта",
        satisfied_clients: "Довольных клиентов",
        services_completed: "Выполненных услуг",
        
        // Stats
        stats_users: "Пользователей",
        stats_orders: "Заказов",
        stats_services: "Услуг",
        stats_satisfaction: "Довольных клиентов",
        
        // Features
        features_title: "Наши преимущества",
        feature_quality: "Высокое качество",
        feature_quality_desc: "Профессиональный подход к каждому заказу с гарантией качества",
        feature_speed: "Быстрое выполнение",
        feature_speed_desc: "Оперативное решение ваших задач в кратчайшие сроки",
        feature_support: "24/7 Поддержка",
        feature_support_desc: "Круглосуточная техническая поддержка и консультации",
        feature_price: "Доступные цены",
        feature_price_desc: "Конкурентные цены на все виды услуг",
        feature_security: "Безопасность",
        feature_security_desc: "Полная конфиденциальность и безопасность ваших данных",
        feature_warranty: "Гарантия",
        feature_warranty_desc: "Гарантия на все выполненные работы",
        
        // Services
        services_title: "Наши услуги",
        service_basic: "Базовые",
        service_advanced: "Продвинутые",
        view_all_services: "Все услуги",
        order_service: "Заказать",
        service_details_title: "Подробное описание услуг",
        
        // Service Details
        bootloader_unlock_title: "Разблокировка загрузчика",
        bootloader_unlock_desc: "Разблокировка загрузчика (Bootloader Unlock) - это процедура, которая позволяет получить полный контроль над вашим Android-устройством. После разблокировки вы сможете устанавливать кастомные прошивки, получать root-права и модифицировать системные файлы.",
        
        root_installation_title: "Установка root-прав",
        root_installation_desc: "Root-права дают вам административный доступ к операционной системе Android. С root-правами вы можете удалять системные приложения, устанавливать специальные программы, изменять системные настройки и получить полный контроль над устройством.",
        
        custom_rom_title: "Прошивка устройств",
        custom_rom_desc: "Установка кастомных прошивок позволяет полностью изменить операционную систему вашего устройства. Мы устанавливаем популярные прошивки как LineageOS, Pixel Experience, MIUI и другие, что дает новые функции и улучшенную производительность.",
        
        os_installation_title: "Установка ОС (ПК)",
        os_installation_desc: "Профессиональная установка операционных систем Windows (7, 10, 11) и Linux (Ubuntu, Debian, Arch). Включает настройку драйверов, установку необходимого ПО и оптимизацию системы для максимальной производительности.",
        
        recovery_installation_title: "Установка рекавери",
        recovery_installation_desc: "Установка кастомного рекавери (TWRP, CWM) для расширенного управления устройством. Рекавери позволяет создавать резервные копии, устанавливать прошивки, очищать разделы и выполнять другие системные операции.",
        
        virus_removal_title: "Удаление вирусов",
        virus_removal_desc: "Комплексная очистка устройств от вирусов, троянов, рекламного ПО и других вредоносных программ. Включает глубокое сканирование, удаление угроз и установку защитного ПО для предотвращения повторного заражения.",
        
        edl_recovery_title: "Восстановление через EDL",
        edl_recovery_desc: "Emergency Download Mode (EDL) - это специальный режим для восстановления устройств Qualcomm, которые не загружаются или имеют серьезные программные повреждения. Позволяет восстановить даже 'мертвые' устройства на уровне загрузчика.",
        
        // Cabinet
        cabinet_title: "Личный кабинет",
        login_google: "Войти через Google",
        login_required: "Необходимо войти в систему",
        login_description: "Войдите в свой аккаунт для доступа к личному кабинету",
        my_orders: "Мои заказы",
        order_history: "История заказов",
        
        // Support
        support_title: "Техническая поддержка",
        support_description: "Опишите вашу проблему, и мы поможем её решить",
        support_subject: "Тема обращения",
        support_message: "Сообщение",
        support_send: "Отправить",
        
        // Payment
        payment_title: "Оплата заказа",
        payment_method: "Способ оплаты",
        payment_card_ukraine: "Перевод на карту (Украина)",
        payment_crypto: "Криптовалюта (TON)",
        payment_stars: "Telegram Stars",
        pay_now: "Оплатить",
        upload_screenshot: "Загрузить скриншот",
        payment_pending: "Ожидает подтверждения",
        
        // Receipts
        receipt_title: "Чек об оплате",
        receipt_download_html: "Скачать HTML",
        receipt_download_txt: "Скачать TXT",
        
        // Admin
        admin_panel: "Админ панель",
        admin_users: "Пользователи",
        admin_orders: "Заказы",
        admin_payments: "Платежи",
        admin_approve: "Одобрить",
        admin_reject: "Отклонить",
        
        // Settings
        settings_title: "Настройки",
        settings_language: "Язык",
        settings_theme: "Тема",
        settings_save: "Сохранить",
        
        // Footer
        footer_rights: "© 2025 Rootzsu Services. Все права защищены.",
        footer_contact: "Контакты",
        footer_about: "О нас",
        footer_privacy: "Конфиденциальность",
        
        // Common
        loading: "Загрузка...",
        error: "Ошибка",
        success: "Успешно",
        cancel: "Отмена",
        save: "Сохранить",
        close: "Закрыть",
        status: "Статус",
        date: "Дата",
        amount: "Сумма",
        details: "Подробности"
    },
    
    en: {
        // Navigation
        nav_home: "Home",
        nav_services: "Services",
        nav_team: "Team",
        nav_cabinet: "Cabinet",
        nav_status: "Status",
        nav_admin: "Admin",
        nav_support: "Support",
        nav_service_details: "Service Details",
        
        // Header
        settings: "Settings",
        
        // Home page
        welcome_title: "Welcome to ROOTZSU",
        welcome_subtitle: "Professional IT Services and Technical Support",
        hero_description: "We provide high-quality services for device configuration, software installation, and technical support. Our team of experts is ready to solve any technical tasks with mobile devices and computers.",
        get_started: "Get Started",
        learn_more: "Learn More",
        
        // About section
        about_title: "About Our Company",
        about_description: "ROOTZSU is a team of professionals with years of experience in mobile technologies and system administration. We specialize in bootloader unlocking, custom firmware installation, device recovery, and solving complex technical tasks.",
        why_choose_us: "Why Choose Us",
        experience_years: "Years of Experience",
        satisfied_clients: "Satisfied Clients",
        services_completed: "Services Completed",
        
        // Stats
        stats_users: "Users",
        stats_orders: "Orders",
        stats_services: "Services",
        stats_satisfaction: "Satisfied Clients",
        
        // Features
        features_title: "Our Advantages",
        feature_quality: "High Quality",
        feature_quality_desc: "Professional approach to every order with quality guarantee",
        feature_speed: "Fast Execution",
        feature_speed_desc: "Quick solution of your tasks in the shortest time",
        feature_support: "24/7 Support",
        feature_support_desc: "Round-the-clock technical support and consultations",
        feature_price: "Affordable Prices",
        feature_price_desc: "Competitive prices for all types of services",
        feature_security: "Security",
        feature_security_desc: "Complete confidentiality and security of your data",
        feature_warranty: "Warranty",
        feature_warranty_desc: "Warranty on all completed work",
        
        // Services
        services_title: "Our Services",
        service_basic: "Basic",
        service_advanced: "Advanced",
        view_all_services: "All Services",
        order_service: "Order",
        service_details_title: "Detailed Service Description",
        
        // Service Details
        bootloader_unlock_title: "Bootloader Unlock",
        bootloader_unlock_desc: "Bootloader Unlock is a procedure that allows you to gain full control over your Android device. After unlocking, you can install custom firmware, gain root access, and modify system files.",
        
        root_installation_title: "Root Installation",
        root_installation_desc: "Root access gives you administrative access to the Android operating system. With root rights, you can remove system apps, install special programs, change system settings, and get full control over the device.",
        
        custom_rom_title: "Device Firmware",
        custom_rom_desc: "Installing custom firmware allows you to completely change your device's operating system. We install popular firmware like LineageOS, Pixel Experience, MIUI and others, providing new features and improved performance.",
        
        os_installation_title: "OS Installation (PC)",
        os_installation_desc: "Professional installation of Windows (7, 10, 11) and Linux (Ubuntu, Debian, Arch) operating systems. Includes driver setup, necessary software installation, and system optimization for maximum performance.",
        
        recovery_installation_title: "Recovery Installation",
        recovery_installation_desc: "Installation of custom recovery (TWRP, CWM) for advanced device management. Recovery allows creating backups, installing firmware, clearing partitions, and performing other system operations.",
        
        virus_removal_title: "Virus Removal",
        virus_removal_desc: "Comprehensive cleaning of devices from viruses, trojans, adware, and other malicious programs. Includes deep scanning, threat removal, and protective software installation to prevent reinfection.",
        
        edl_recovery_title: "EDL Recovery",
        edl_recovery_desc: "Emergency Download Mode (EDL) is a special mode for recovering Qualcomm devices that won't boot or have serious software damage. Allows recovery of even 'dead' devices at the bootloader level.",
        
        // Cabinet
        cabinet_title: "Personal Cabinet",
        login_google: "Login with Google",
        login_required: "Login Required",
        login_description: "Login to your account to access the personal cabinet",
        my_orders: "My Orders",
        order_history: "Order History",
        
        // Support
        support_title: "Technical Support",
        support_description: "Describe your problem and we'll help solve it",
        support_subject: "Subject",
        support_message: "Message",
        support_send: "Send",
        
        // Payment
        payment_title: "Order Payment",
        payment_method: "Payment Method",
        payment_card_ukraine: "Card Transfer (Ukraine)",
        payment_crypto: "Cryptocurrency (TON)",
        payment_stars: "Telegram Stars",
        pay_now: "Pay Now",
        upload_screenshot: "Upload Screenshot",
        payment_pending: "Pending Confirmation",
        
        // Receipts
        receipt_title: "Payment Receipt",
        receipt_download_html: "Download HTML",
        receipt_download_txt: "Download TXT",
        
        // Admin
        admin_panel: "Admin Panel",
        admin_users: "Users",
        admin_orders: "Orders",
        admin_payments: "Payments",
        admin_approve: "Approve",
        admin_reject: "Reject",
        
        // Settings
        settings_title: "Settings",
        settings_language: "Language",
        settings_theme: "Theme",
        settings_save: "Save",
        
        // Footer
        footer_rights: "© 2025 Rootzsu Services. All rights reserved.",
        footer_contact: "Contact",
        footer_about: "About",
        footer_privacy: "Privacy",
        
        // Common
        loading: "Loading...",
        error: "Error",
        success: "Success",
        cancel: "Cancel",
        save: "Save",
        close: "Close",
        status: "Status",
        date: "Date",
        amount: "Amount",
        details: "Details"
    },
    
    uk: {
        // Navigation
        nav_home: "Головна",
        nav_services: "Послуги",
        nav_team: "Команда", 
        nav_cabinet: "Кабінет",
        nav_status: "Статус",
        nav_admin: "Адмін",
        nav_support: "Підтримка",
        nav_service_details: "Опис послуг",
        
        // Header
        settings: "Налаштування",
        
        // Home page
        welcome_title: "Ласкаво просимо до ROOTZSU",
        welcome_subtitle: "Професійні IT-послуги та технічна підтримка",
        hero_description: "Ми надаємо високоякісні послуги з налаштування пристроїв, встановлення ПЗ та технічної підтримки. Наша команда експертів готова вирішити будь-які технічні завдання з мобільними пристроями та комп'ютерами.",
        get_started: "Почати роботу",
        learn_more: "Дізнатися більше",
        
        // About section
        about_title: "Про нашу компанію",
        about_description: "ROOTZSU - це команда професіоналів з багаторічним досвідом у сфері мобільних технологій та системного адміністрування. Ми спеціалізуємося на розблокуванні завантажувачів, встановленні кастомних прошивок, відновленні пристроїв та вирішенні складних технічних завдань.",
        why_choose_us: "Чому обирають нас",
        experience_years: "Років досвіду",
        satisfied_clients: "Задоволених клієнтів",
        services_completed: "Виконаних послуг",
        
        // Stats
        stats_users: "Користувачів",
        stats_orders: "Замовлень",
        stats_services: "Послуг",
        stats_satisfaction: "Задоволених клієнтів",
        
        // Features
        features_title: "Наші переваги",
        feature_quality: "Висока якість",
        feature_quality_desc: "Професійний підхід до кожного замовлення з гарантією якості",
        feature_speed: "Швидке виконання",
        feature_speed_desc: "Оперативне вирішення ваших завдань у найкоротші терміни",
        feature_support: "24/7 Підтримка",
        feature_support_desc: "Цілодобова технічна підтримка та консультації",
        feature_price: "Доступні ціни",
        feature_price_desc: "Конкурентні ціни на всі види послуг",
        feature_security: "Безпека",
        feature_security_desc: "Повна конфіденційність та безпека ваших даних",
        feature_warranty: "Гарантія",
        feature_warranty_desc: "Гарантія на всі виконані роботи",
        
        // Services
        services_title: "Наші послуги",
        service_basic: "Базові",
        service_advanced: "Просунуті",
        view_all_services: "Всі послуги",
        order_service: "Замовити",
        service_details_title: "Детальний опис послуг",
        
        // Service Details
        bootloader_unlock_title: "Розблокування завантажувача",
        bootloader_unlock_desc: "Розблокування завантажувача - це процедура, яка дозволяє отримати повний контроль над вашим Android-пристроєм. Після розблокування ви зможете встановлювати кастомні прошивки, отримувати root-права та модифікувати системні файли.",
        
        root_installation_title: "Встановлення root-прав",
        root_installation_desc: "Root-права дають вам адміністративний доступ до операційної системи Android. З root-правами ви можете видаляти системні додатки, встановлювати спеціальні програми, змінювати системні налаштування та отримати повний контроль над пристроєм.",
        
        custom_rom_title: "Прошивка пристроїв",
        custom_rom_desc: "Встановлення кастомних прошивок дозволяє повністю змінити операційну систему вашого пристрою. Ми встановлюємо популярні прошивки як LineageOS, Pixel Experience, MIUI та інші, що дає нові функції та покращену продуктивність.",
        
        os_installation_title: "Встановлення ОС (ПК)",
        os_installation_desc: "Професійне встановлення операційних систем Windows (7, 10, 11) та Linux (Ubuntu, Debian, Arch). Включає налаштування драйверів, встановлення необхідного ПЗ та оптимізацію системи для максимальної продуктивності.",
        
        recovery_installation_title: "Встановлення рекавері",
        recovery_installation_desc: "Встановлення кастомного рекавері (TWRP, CWM) для розширеного управління пристроєм. Рекавері дозволяє створювати резервні копії, встановлювати прошивки, очищати розділи та виконувати інші системні операції.",
        
        virus_removal_title: "Видалення вірусів",
        virus_removal_desc: "Комплексне очищення пристроїв від вірусів, троянів, рекламного ПЗ та інших шкідливих програм. Включає глибоке сканування, видалення загроз та встановлення захисного ПЗ для запобігання повторного зараження.",
        
        edl_recovery_title: "Відновлення через EDL",
        edl_recovery_desc: "Emergency Download Mode (EDL) - це спеціальний режим для відновлення пристроїв Qualcomm, які не завантажуються або мають серйозні програмні пошкодження. Дозволяє відновити навіть 'мертві' пристрої на рівні завантажувача.",
        
        // Cabinet
        cabinet_title: "Особистий кабінет",
        login_google: "Увійти через Google",
        login_required: "Необхідно увійти в систему",
        login_description: "Увійдіть у свій акаунт для доступу до особистого кабінету",
        my_orders: "Мої замовлення",
        order_history: "Історія замовлень",
        
        // Support
        support_title: "Технічна підтримка",
        support_description: "Опишіть вашу проблему, і ми допоможемо її вирішити",
        support_subject: "Тема звернення",
        support_message: "Повідомлення",
        support_send: "Відправити",
        
        // Payment
        payment_title: "Оплата замовлення",
        payment_method: "Спосіб оплати",
        payment_card_ukraine: "Переказ на картку (Україна)",
        payment_crypto: "Криптовалюта (TON)",
        payment_stars: "Telegram Stars",
        pay_now: "Оплатити",
        upload_screenshot: "Завантажити скріншот",
        payment_pending: "Очікує підтвердження",
        
        // Receipts
        receipt_title: "Чек про оплату",
        receipt_download_html: "Завантажити HTML",
        receipt_download_txt: "Завантажити TXT",
        
        // Admin
        admin_panel: "Адмін панель",
        admin_users: "Користувачі",
        admin_orders: "Замовлення",
        admin_payments: "Платежі",
        admin_approve: "Схвалити",
        admin_reject: "Відхилити",
        
        // Settings
        settings_title: "Налаштування",
        settings_language: "Мова",
        settings_theme: "Тема",
        settings_save: "Зберегти",
        
        // Footer
        footer_rights: "© 2025 Rootzsu Services. Всі права захищені.",
        footer_contact: "Контакти",
        footer_about: "Про нас",
        footer_privacy: "Конфіденційність",
        
        // Common
        loading: "Завантаження...",
        error: "Помилка",
        success: "Успішно",
        cancel: "Скасувати",
        save: "Зберегти",
        close: "Закрити",
        status: "Статус",
        date: "Дата",
        amount: "Сума",
        details: "Подробиці"
    },
    
    kz: {
        // Navigation
        nav_home: "Басты бет",
        nav_services: "Қызметтер",
        nav_team: "Команда",
        nav_cabinet: "Кабинет",
        nav_status: "Мәртебе",
        nav_admin: "Админ",
        nav_support: "Қолдау",
        nav_service_details: "Қызметтер сипаттамасы",
        
        // Header
        settings: "Баптаулар",
        
        // Home page
        welcome_title: "ROOTZSU-ға қош келдіңіз",
        welcome_subtitle: "Кәсіби IT қызметтері мен техникалық қолдау",
        hero_description: "Біз құрылғыларды баптау, бағдарламалық жасақтаманы орнату және техникалық қолдау бойынша жоғары сапалы қызметтер ұсынамыз. Біздің сарапшылар тобы мобильді құрылғылар мен компьютерлермен кез келген техникалық міндеттерді шешуге дайын.",
        get_started: "Жұмысты бастау",
        learn_more: "Көбірек білу",
        
        // About section
        about_title: "Біздің компания туралы",
        about_description: "ROOTZSU - бұл мобильді технологиялар мен жүйелік әкімшілендіру саласында көп жылдық тәжірибесі бар мамандар тобы. Біз жүктеуішті ашу, арнайы микробағдарламаларды орнату, құрылғыларды қалпына келтіру және күрделі техникалық міндеттерді шешу бойынша мамандандық.",
        why_choose_us: "Бізді неге таңдайды",
        experience_years: "Жыл тәжірибе",
        satisfied_clients: "Қанағаттанған клиенттер",
        services_completed: "Орындалған қызметтер",
        
        // Stats
        stats_users: "Пайдаланушылар",
        stats_orders: "Тапсырыстар",
        stats_services: "Қызметтер",
        stats_satisfaction: "Қанағаттанған клиенттер",
        
        // Features
        features_title: "Біздің артықшылықтар",
        feature_quality: "Жоғары сапа",
        feature_quality_desc: "Сапа кепілдігімен әрбір тапсырысқа кәсіби көзқарас",
        feature_speed: "Жылдам орындау",
        feature_speed_desc: "Сіздің міндеттеріңізді ең қысқа мерзімде жедел шешу",
        feature_support: "24/7 Қолдау",
        feature_support_desc: "Тәулік бойы техникалық қолдау және кеңес беру",
        feature_price: "Қолжетімді бағалар",
        feature_price_desc: "Барлық қызмет түрлеріне бәсекеге қабілетті бағалар",
        feature_security: "Қауіпсіздік",
        feature_security_desc: "Сіздің деректеріңіздің толық құпиялылығы мен қауіпсіздігі",
        feature_warranty: "Кепілдік",
        feature_warranty_desc: "Барлық орындалған жұмыстарға кепілдік",
        
        // Services
        services_title: "Біздің қызметтер",
        service_basic: "Негізгі",
        service_advanced: "Кеңейтілген",
        view_all_services: "Барлық қызметтер",
        order_service: "Тапсырыс беру",
        service_details_title: "Қызметтердің толық сипаттамасы",
        
        // Service Details
        bootloader_unlock_title: "Жүктеуішті ашу",
        bootloader_unlock_desc: "Жүктеуішті ашу - бұл Android құрылғыңызға толық бақылау алуға мүмкіндік беретін процедура. Ашқаннан кейін сіз арнайы микробағдарламаларды орната аласыз, root құқықтарын ала аласыз және жүйелік файлдарды өзгерте аласыз.",
        
        root_installation_title: "Root құқықтарын орнату",
        root_installation_desc: "Root құқықтары сізге Android операциялық жүйесіне әкімшілік қол жеткізуді береді. Root құқықтарымен сіз жүйелік қолданбаларды жоя аласыз, арнайы бағдарламаларды орната аласыз, жүйелік параметрлерді өзгерте аласыз және құрылғыға толық бақылау ала аласыз.",
        
        custom_rom_title: "Құрылғыларды микробағдарламалау",
        custom_rom_desc: "Арнайы микробағдарламаларды орнату құрылғыңыздың операциялық жүйесін толығымен өзгертуге мүмкіндік береді. Біз LineageOS, Pixel Experience, MIUI және басқа танымал микробағдарламаларды орнатамыз, бұл жаңа функциялар мен жақсартылған өнімділік береді.",
        
        os_installation_title: "ОЖ орнату (ПК)",
        os_installation_desc: "Windows (7, 10, 11) және Linux (Ubuntu, Debian, Arch) операциялық жүйелерін кәсіби орнату. Драйверлерді баптауды, қажетті БЖ орнатуды және максималды өнімділік үшін жүйені оңтайландыруды қамтиды.",
        
        recovery_installation_title: "Қалпына келтіруді орнату",
        recovery_installation_desc: "Құрылғыны кеңейтілген басқару үшін арнайы қалпына келтіруді (TWRP, CWM) орнату. Қалпына келтіру сақтық көшірмелерін жасауға, микробағдарламаларды орнатуға, бөлімдерді тазалауға және басқа жүйелік операцияларды орындауға мүмкіндік береді.",
        
        virus_removal_title: "Вирустарды жою",
        virus_removal_desc: "Құрылғыларды вирустардан, троян бағдарламаларынан, жарнамалық БЖ-дан және басқа зиянды бағдарламалардан кешенді тазалау. Терең сканерлеуді, қауіптерді жоюды және қайта жұқтыруды болдырмау үшін қорғаныс БЖ орнатуды қамтиды.",
        
        edl_recovery_title: "EDL арқылы қалпына келтіру",
        edl_recovery_desc: "Emergency Download Mode (EDL) - бұл жүктелмейтін немесе ауыр бағдарламалық зақымдары бар Qualcomm құрылғыларын қалпына келтіру үшін арнайы режим. Жүктеуіш деңгейінде тіпті 'өлі' құрылғыларды қалпына келтіруге мүмкіндік береді.",
        
        // Cabinet
        cabinet_title: "Жеке кабинет",
        login_google: "Google арқылы кіру",
        login_required: "Жүйеге кіру қажет",
        login_description: "Жеке кабинетке қол жеткізу үшін аккаунтыңызға кіріңіз",
        my_orders: "Менің тапсырыстарым",
        order_history: "Тапсырыстар тарихы",
        
        // Support
        support_title: "Техникалық қолдау",
        support_description: "Мәселеңізді сипаттаңыз, біз оны шешуге көмектесеміз",
        support_subject: "Өтініш тақырыбы",
        support_message: "Хабарлама",
        support_send: "Жіберу",
        
        // Payment
        payment_title: "Тапсырысты төлеу",
        payment_method: "Төлем әдісі",
        payment_card_ukraine: "Картаға аударым (Украина)",
        payment_crypto: "Криптовалюта (TON)",
        payment_stars: "Telegram Stars",
        pay_now: "Төлеу",
        upload_screenshot: "Скриншот жүктеу",
        payment_pending: "Растауды күтуде",
        
        // Receipts
        receipt_title: "Төлем чегі",
        receipt_download_html: "HTML жүктеу",
        receipt_download_txt: "TXT жүктеу",
        
        // Admin
        admin_panel: "Админ панелі",
        admin_users: "Пайдаланушылар",
        admin_orders: "Тапсырыстар",
        admin_payments: "Төлемдер",
        admin_approve: "Мақұлдау",
        admin_reject: "Қабылдамау",
        
        // Settings
        settings_title: "Баптаулар",
        settings_language: "Тіл",
        settings_theme: "Тема",
        settings_save: "Сақтау",
        
        // Footer
        footer_rights: "© 2025 Rootzsu Services. Барлық құқықтар қорғалған.",
        footer_contact: "Байланыс",
        footer_about: "Біз туралы",
        footer_privacy: "Құпиялылық",
        
        // Common
        loading: "Жүктелуде...",
        error: "Қате",
        success: "Сәтті",
        cancel: "Болдырмау",
        save: "Сақтау",
        close: "Жабу",
        status: "Мәртебе",
        date: "Күн",
        amount: "Сома",
        details: "Толық ақпарат"
    }
};

// Language management
let currentLanguage = localStorage.getItem('language') || 'ru';

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updatePageLanguage();
}

function t(key) {
    return translations[currentLanguage][key] || translations['ru'][key] || key;
}

function updatePageLanguage() {
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (translations[currentLanguage][key]) {
            if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
    
    document.querySelectorAll('[data-tooltip-key]').forEach(element => {
        const key = element.getAttribute('data-tooltip-key');
        if (translations[currentLanguage][key]) {
            element.setAttribute('data-tooltip', translations[currentLanguage][key]);
        }
    });
}

// Initialize language switcher
function initLanguageSwitcher() {
    const switcher = document.getElementById('language-switcher');
    if (!switcher) {
        console.warn('Language switcher element not found');
        return;
    }
    
    try {
        switcher.innerHTML = `
            <button class="lang-btn ${currentLanguage === 'ru' ? 'active' : ''}" data-lang="ru">RU</button>
            <button class="lang-btn ${currentLanguage === 'en' ? 'active' : ''}" data-lang="en">EN</button>
            <button class="lang-btn ${currentLanguage === 'uk' ? 'active' : ''}" data-lang="uk">UK</button>
            <button class="lang-btn ${currentLanguage === 'kz' ? 'active' : ''}" data-lang="kz">KZ</button>
        `;
        
        switcher.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                setLanguage(lang);
                
                switcher.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    } catch (error) {
        console.error('Error initializing language switcher:', error);
    }
}

// Make functions globally available
window.t = t;
window.setLanguage = setLanguage;
window.updatePageLanguage = updatePageLanguage;
window.initLanguageSwitcher = initLanguageSwitcher;