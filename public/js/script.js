// Main Application Script
class RootzsuApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.isAdmin = false;
        this.services = [];
        this.settings = this.loadSettings();
        // ВАЖНО: ID должен совпадать с бэкендом
        this.googleClientId = "957687109285-gs24ojtjhjkatpi7n0rrpb1c57tf95e2.apps.googleusercontent.com"; 
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize components
            this.initializeTheme();
            this.initializeLanguage();
            this.initializeClock();
            this.initializeNavigation();
            this.initializeModals();
            this.initializeParticles();
            this.initializeAuth(); // Инициализация аутентификации
            
            // Load initial data
            await this.loadServices();
            
            // Show intro animation
            this.showIntroAnimation();
            
            // Load initial page
            setTimeout(() => {
                this.hidePreloader();
                this.loadPage('home');
            }, 3000);
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.hidePreloader();
            this.showToast('Ошибка инициализации приложения', 'error');
        }
    }
    
    // Theme Management
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.applyTheme(savedTheme);
        
        // Update particles theme if available
        if (window.particleSystem) {
            window.particleSystem.updateTheme(savedTheme);
        }
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update particles theme
        if (window.particleSystem) {
            window.particleSystem.updateTheme(theme);
        }
    }
    
    // Language Management
    initializeLanguage() {
        initLanguageSwitcher();
        updatePageLanguage();
    }
    
    // Clock
    initializeClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }
    
    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const clockElement = document.getElementById('live-clock');
        if (clockElement) {
            clockElement.textContent = timeString;
        }
    }
    
    // Navigation
    initializeNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').substring(1);
                this.loadPage(page);
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
        
        // Navigation style switcher
        const navStyleSelect = document.getElementById('nav-style-select');
        if (navStyleSelect) {
            navStyleSelect.addEventListener('change', (e) => {
                this.changeNavigationStyle(e.target.value);
            });
        }
    }
    
    changeNavigationStyle(style) {
        const nav = document.querySelector('nav');
        const body = document.body;
        
        // Remove all navigation classes
        nav.className = '';
        body.className = body.className.replace(/nav-\w+/g, '');
        
        // Add new style
        nav.classList.add(style);
        if (style.includes('sidebar')) {
            body.classList.add(`nav-${style}`);
        }
        
        localStorage.setItem('navStyle', style);
    }
    
    // Modals
    initializeModals() {
        // Settings modal
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        
        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                settingsModal.classList.add('show');
            });
        }
        
        // Close modals
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-container');
                if (modal) {
                    modal.classList.remove('show');
                }
            });
        });
        
        // Close modals on backdrop click
        document.querySelectorAll('.modal-container').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
        
        // Theme switcher
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                this.applyTheme(theme);
                
                // Update active state
                document.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Save settings
        const saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
                settingsModal.classList.remove('show');
                this.showToast('Настройки сохранены', 'success');
            });
        }
        
        // Chat button
        const chatButton = document.getElementById('chat-button');
        const geminiModal = document.getElementById('gemini-modal');
        
        if (chatButton && geminiModal) {
            chatButton.addEventListener('click', () => {
                geminiModal.classList.add('show');
            });
        }
        
        // Gemini chat form
        const geminiForm = document.getElementById('gemini-form');
        if (geminiForm) {
            geminiForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendGeminiMessage();
            });
        }
    }
    
    // Particles
    initializeParticles() {
        const particlesToggle = document.getElementById('particles-toggle');
        if (particlesToggle) {
            const particlesEnabled = localStorage.getItem('particles') !== 'false';
            particlesToggle.checked = particlesEnabled;
            
            particlesToggle.addEventListener('change', (e) => {
                const canvas = document.getElementById('particle-canvas');
                if (canvas) {
                    canvas.style.display = e.target.checked ? 'block' : 'none';
                }
                localStorage.setItem('particles', e.target.checked);
            });
            
            // Apply initial state
            const canvas = document.getElementById('particle-canvas');
            if (canvas && !particlesEnabled) {
                canvas.style.display = 'none';
            }
        }
    }
    
    // Intro Animation
    showIntroAnimation() {
        const intro = document.getElementById('intro-animation');
        if (intro) {
            intro.style.display = 'flex';
            setTimeout(() => {
                intro.style.opacity = '0';
                setTimeout(() => {
                    intro.style.display = 'none';
                }, 500);
            }, 2500);
        }
    }
    
    // Preloader
    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
    }
    
    // Services
    async loadServices() {
        try {
            const response = await fetch('/api/services');
            if (response.ok) {
                this.services = await response.json();
            } else {
                console.error('Failed to load services');
                // Fallback services
                this.services = this.getFallbackServices();
            }
        } catch (error) {
            console.error('Error loading services:', error);
            this.services = this.getFallbackServices();
        }
    }
    
    getFallbackServices() {
        return [
            {
                service_id: 1,
                name: "Разблокировка загрузчика",
                description: "Разблокировка bootloader для установки кастомных прошивок",
                category: "advanced",
                price_usd: 40.00,
                price_eur: 37.00,
                price_uah: 1520.00,
                price_coins: 400,
                difficulty_level: "advanced",
                estimated_time: "1-2 часа"
            },
            {
                service_id: 2,
                name: "Установка root-прав",
                description: "Получение root-доступа на Android устройствах",
                category: "advanced",
                price_usd: 35.00,
                price_eur: 32.00,
                price_uah: 1330.00,
                price_coins: 350,
                difficulty_level: "advanced",
                estimated_time: "1-2 часа"
            },
            {
                service_id: 3,
                name: "Настройка ПК",
                description: "Полная настройка и оптимизация персонального компьютера",
                category: "basic",
                price_usd: 25.00,
                price_eur: 23.00,
                price_uah: 950.00,
                price_coins: 250,
                difficulty_level: "beginner",
                estimated_time: "2-3 часа"
            }
        ];
    }
    
    // Page Loading
    async loadPage(page) {
        this.currentPage = page;
        const app = document.getElementById('app');
        
        if (!app) return;
        
        try {
            let content = '';
            
            switch (page) {
                case 'home':
                    content = this.getHomePage();
                    break;
                case 'services':
                    content = this.getServicesPage();
                    break;
                case 'team':
                    content = this.getTeamPage();
                    break;
                case 'cabinet':
                    content = this.getCabinetPage();
                    break;
                case 'status':
                    content = await this.getStatusPage();
                    break;
                case 'support':
                    content = this.getSupportPage();
                    break;
                case 'admin':
                    if (this.isAdmin) {
                        content = await this.getAdminDashboardPage();
                    } else {
                        content = this.getAdminLoginPage();
                    }
                    break;
                default:
                    content = this.getNotFoundPage();
            }
            
            app.innerHTML = content;
            this.bindPageEvents();
            
        } catch (error) {
            console.error('Error loading page:', error);
            app.innerHTML = this.getErrorPage();
        }
    }
    
    // Page Content
    getHomePage() {
        return `
            <div class="hero-section fade-in">
                <div class="hero-content">
                    <h1 class="hero-title" data-lang-key="welcome_title">Добро пожаловать в ROOTZSU</h1>
                    <p class="hero-subtitle" data-lang-key="welcome_subtitle">Профессиональные IT-услуги и техническая поддержка</p>
                    <p class="hero-description" data-lang-key="hero_description">
                        Мы предоставляем высококачественные услуги по настройке устройств, установке ПО и технической поддержке. 
                        Наша команда экспертов готова решить любые технические задачи.
                    </p>
                    <div class="hero-buttons">
                        <button class="btn primary" onclick="app.loadPage('services')">
                            <i class="fa-solid fa-rocket"></i>
                            <span data-lang-key="get_started">Начать работу</span>
                        </button>
                        <button class="btn secondary" onclick="app.loadPage('team')">
                            <i class="fa-solid fa-info-circle"></i>
                            <span data-lang-key="learn_more">Узнать больше</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="stats-section fade-in">
                <div class="stat-card glass">
                    <div class="stat-number">1000+</div>
                    <div class="stat-label" data-lang-key="stats_users">Пользователей</div>
                </div>
                <div class="stat-card glass">
                    <div class="stat-number">500+</div>
                    <div class="stat-label" data-lang-key="stats_orders">Заказов</div>
                </div>
                <div class="stat-card glass">
                    <div class="stat-number">15</div>
                    <div class="stat-label" data-lang-key="stats_services">Услуг</div>
                </div>
                <div class="stat-card glass">
                    <div class="stat-number">98%</div>
                    <div class="stat-label" data-lang-key="stats_satisfaction">Довольных клиентов</div>
                </div>
            </div>
            
            <div class="features-section fade-in">
                <h2 data-lang-key="features_title">Почему выбирают нас</h2>
                <div class="features-grid">
                    <div class="feature-card glass">
                        <div class="feature-icon">
                            <i class="fa-solid fa-star"></i>
                        </div>
                        <h3 class="feature-title" data-lang-key="feature_quality">Высокое качество</h3>
                        <p class="feature-description" data-lang-key="feature_quality_desc">Профессиональный подход к каждому заказу</p>
                    </div>
                    <div class="feature-card glass">
                        <div class="feature-icon">
                            <i class="fa-solid fa-bolt"></i>
                        </div>
                        <h3 class="feature-title" data-lang-key="feature_speed">Быстрое выполнение</h3>
                        <p class="feature-description" data-lang-key="feature_speed_desc">Оперативное решение ваших задач</p>
                    </div>
                    <div class="feature-card glass">
                        <div class="feature-icon">
                            <i class="fa-solid fa-headset"></i>
                        </div>
                        <h3 class="feature-title" data-lang-key="feature_support">24/7 Поддержка</h3>
                        <p class="feature-description" data-lang-key="feature_support_desc">Круглосуточная техническая поддержка</p>
                    </div>
                    <div class="feature-card glass">
                        <div class="feature-icon">
                            <i class="fa-solid fa-dollar-sign"></i>
                        </div>
                        <h3 class="feature-title" data-lang-key="feature_price">Доступные цены</h3>
                        <p class="feature-description" data-lang-key="feature_price_desc">Конкурентные цены на все услуги</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    getServicesPage() {
        const basicServices = this.services.filter(s => s.category === 'basic');
        const advancedServices = this.services.filter(s => s.category === 'advanced');
        
        return `
            <div class="fade-in">
                <h2 data-lang-key="services_title">Наши услуги</h2>
                
                <div class="service-categories">
                    <div class="category-buttons">
                        <button class="category-btn active" data-category="all">Все услуги</button>
                        <button class="category-btn" data-category="basic">Базовые</button>
                        <button class="category-btn" data-category="advanced">Продвинутые</button>
                    </div>
                </div>
                
                <div class="grid" id="services-grid">
                    ${this.services.map(service => this.renderServiceCard(service)).join('')}
                </div>
            </div>
        `;
    }
    
    renderServiceCard(service) {
        const difficultyColors = {
            beginner: 'success',
            intermediate: 'info',
            advanced: 'warning',
            expert: 'danger'
        };
        
        return `
            <div class="service-item glass" data-category="${service.category}">
                <div class="service-header">
                    <div class="icon">
                        <i class="fa-solid ${service.category === 'basic' ? 'fa-cog' : 'fa-microchip'}"></i>
                    </div>
                    <div class="service-badges">
                        <span class="badge ${service.category === 'basic' ? 'basic' : 'advanced'}">${service.category}</span>
                        <span class="badge difficulty">${service.difficulty_level}</span>
                    </div>
                </div>
                
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                
                <div class="service-info">
                    <div class="time-estimate">
                        <i class="fa-solid fa-clock"></i>
                        <span>${service.estimated_time}</span>
                    </div>
                </div>
                
                <div class="prices">
                    <div class="price-row">USD: $${service.price_usd}</div>
                    <div class="price-row">EUR: €${service.price_eur}</div>
                    <div class="price-row">UAH: ₴${service.price_uah}</div>
                    <div class="price-row coins-price">
                        <i class="fa-solid fa-coins"></i>
                        ${service.price_coins} монет
                    </div>
                </div>
                
                <div class="service-actions">
                    <button class="btn primary" onclick="app.orderService(${service.service_id})">
                        <i class="fa-solid fa-shopping-cart"></i>
                        <span data-lang-key="order_service">Заказать</span>
                    </button>
                    <button class="btn secondary" onclick="app.showReviews(${service.service_id})">
                        <i class="fa-solid fa-star"></i>
                        Отзывы
                    </button>
                </div>
            </div>
        `;
    }
    
    getTeamPage() {
        return `
            <div class="fade-in">
                <h2 data-lang-key="nav_team">Наша команда</h2>
                <div class="grid">
                    <div class="team-card glass">
                        <div class="team-avatar">
                            <i class="fa-solid fa-user-tie" style="font-size: 4rem; color: var(--accent);"></i>
                        </div>
                        <h3>@alpha_rootzsu</h3>
                        <p>Ведущий разработчик</p>
                        <div class="team-skills">
                            <span class="skill-tag">Android</span>
                            <span class="skill-tag">Root</span>
                            <span class="skill-tag">Custom ROM</span>
                        </div>
                        <p>Специалист по мобильным устройствам с опытом работы более 2 лет</p>
                    </div>
                    
                    <div class="team-card glass">
                        <div class="team-avatar">
                            <i class="fa-solid fa-user-gear" style="font-size: 4rem; color: var(--accent);"></i>
                        </div>
                        <h3>@neentron</h3>
                        <p>Продукт-Менеджер</p>
                        <div class="team-skills">
                            <span class="skill-tag">Реклама</span>
                            <span class="skill-tag">Продвижение</span>
                            <span class="skill-tag">Идеи</span>
                        </div>
                        <p>Эксперт по продвижению наших продуктов</p>
                    </div>
                    
                    <div class="team-card glass">
                        <div class="team-avatar">
                            <i class="fa-solid fa-user-shield" style="font-size: 4rem; color: var(--accent);"></i>
                        </div>
                        <h3>@Absolute0707</h3>
                        <p>Специалист по тестировке</p>
                        <div class="team-skills">
                            <span class="skill-tag">QA</span>
                            <span class="skill-tag">Восстановление</span>
                            <span class="skill-tag">Диагностика</span>
                        </div>
                        <p>Профессионал в области QA Инженерии</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    getCabinetPage() {
        if (!this.currentUser) {
            return `
                <div class="fade-in">
                    <div class="glass" style="text-align: center; padding: 60px 40px;">
                        <h2 data-lang-key="login_required">Необходимо войти в систему</h2>
                        <p data-lang-key="login_description">Войдите в свой аккаунт для доступа к личному кабинету</p>
                        
                        <div id="google-signin-container" style="display: flex; justify-content: center; margin-top: 20px;"></div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="fade-in">
                <h2 data-lang-key="cabinet_title">Личный кабинет</h2>
                
                <div class="cabinet-grid">
                    <div class="profile-sidebar glass">
                        <img src="${this.currentUser.avatar_url || 'https://via.placeholder.com/100'}" alt="Avatar" class="avatar">
                        <h3 class="name">${this.currentUser.first_name} ${this.currentUser.last_name || ''}</h3>
                        <p class="email">${this.currentUser.email}</p>
                        
                        <div class="coins-display">
                            <i class="fa-solid fa-coins"></i>
                            <span id="user-coins">${this.currentUser.coins || 0}</span>
                            <span>монет</span>
                        </div>
                        
                        <div class="cabinet-actions">
                            <button class="btn primary" onclick="app.showCoinsPurchase()">
                                <i class="fa-solid fa-plus"></i>
                                Купить монеты
                            </button>
                            <button class="btn secondary" onclick="app.signOut()">
                                <i class="fa-solid fa-sign-out-alt"></i>
                                Выйти
                            </button>
                        </div>
                    </div>
                    
                    <div class="profile-content">
                        <div class="profile-tabs">
                            <button class="tab-btn active" data-tab="orders">Мои заказы</button>
                            <button class="tab-btn" data-tab="transactions">Транзакции</button>
                            <button class="tab-btn" data-tab="support">Поддержка</button>
                        </div>
                        
                        <div class="tab-content">
                            <div class="tab-pane active" id="orders-tab">
                                <div id="user-orders">Загрузка заказов...</div>
                            </div>
                            
                            <div class="tab-pane" id="transactions-tab">
                                <div id="user-transactions">Загрузка транзакций...</div>
                            </div>
                            
                            <div class="tab-pane" id="support-tab">
                                <div id="user-support-tickets">Загрузка тикетов...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async getStatusPage() {
        try {
            const response = await fetch('/api/status');
            const status = response.ok ? await response.json() : this.getFallbackStatus();
            
            return `
                <div class="fade-in">
                    <h2 data-lang-key="nav_status">Статус системы</h2>
                    <div class="status-grid">
                        <div class="status-card glass">
                            <div class="icon">
                                <i class="fa-solid fa-microchip"></i>
                            </div>
                            <div class="label">CPU</div>
                            <div class="value">${status.cpu_usage}%</div>
                        </div>
                        
                        <div class="status-card glass">
                            <div class="icon">
                                <i class="fa-solid fa-memory"></i>
                            </div>
                            <div class="label">RAM</div>
                            <div class="value">${status.ram_usage}%</div>
                        </div>
                        
                        <div class="status-card glass">
                            <div class="icon">
                                <i class="fa-solid fa-hdd"></i>
                            </div>
                            <div class="label">Диск</div>
                            <div class="value">${status.disk_usage}%</div>
                        </div>
                        
                        <div class="status-card glass">
                            <div class="icon">
                                <i class="fa-solid fa-users"></i>
                            </div>
                            <div class="label">Пользователи</div>
                            <div class="value">${status.user_count}</div>
                        </div>
                        
                        <div class="status-card glass">
                            <div class="icon">
                                <i class="fa-solid fa-shopping-cart"></i>
                            </div>
                            <div class="label">Активные заказы</div>
                            <div class="value">${status.active_orders}</div>
                        </div>
                        
                        <div class="status-card glass">
                            <div class="icon">
                                <i class="fa-solid fa-robot"></i>
                            </div>
                            <div class="label">Бот</div>
                            <div class="value">${status.bot_online ? 'Онлайн' : 'Офлайн'}</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading status:', error);
            return this.getErrorPage();
        }
    }
    
    getFallbackStatus() {
        return {
            cpu_usage: 45,
            ram_usage: 62,
            disk_usage: 38,
            user_count: 1000,
            active_orders: 15,
            bot_online: true
        };
    }
    
    getSupportPage() {
        return `
            <div class="fade-in">
                <h2><i class="fa-solid fa-headset"></i> <span data-lang-key="support_title">Техническая поддержка</span></h2>
                
                <div class="support-form glass">
                    <form id="support-form">
                        <p data-lang-key="support_description">Опишите вашу проблему, и мы поможем её решить</p>
                        
                        <div class="form-group">
                            <label data-lang-key="support_subject">Тема обращения</label>
                            <select id="support-category" required>
                                <option value="">Выберите категорию</option>
                                <option value="technical">Техническая проблема</option>
                                <option value="billing">Вопросы по оплате</option>
                                <option value="service">Качество услуг</option>
                                <option value="other">Другое</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Тема</label>
                            <input type="text" id="support-subject" required>
                        </div>
                        
                        <div class="form-group">
                            <label data-lang-key="support_message">Сообщение</label>
                            <textarea id="support-message" rows="5" required></textarea>
                        </div>
                        
                        <button type="submit" class="btn primary" style="width: 100%;">
                            <i class="fa-solid fa-paper-plane"></i>
                            <span data-lang-key="support_send">Отправить</span>
                        </button>
                    </form>
                </div>
            </div>
        `;
    }
    
    getAdminLoginPage() {
        return `
            <div class="fade-in">
                <div class="glass" style="max-width: 500px; margin: 40px auto; padding: 40px;">
                    <h2 style="text-align: center;">Вход для администратора</h2>
                    <form id="admin-login-form">
                        <div class="form-group">
                            <label for="admin-username">Имя пользователя</label>
                            <input type="text" id="admin-username" required>
                        </div>
                        <div class="form-group">
                            <label for="admin-password">Пароль</label>
                            <input type="password" id="admin-password" required>
                        </div>
                        <button type="submit" class="btn primary" style="width: 100%;">Войти</button>
                    </form>
                </div>
            </div>
        `;
    }

    async getAdminDashboardPage() {
        return `
            <div class="fade-in">
                <h2><i class="fa-solid fa-shield-halved"></i> Админ-панель</h2>
                <div class="profile-tabs">
                     <button class="tab-btn active" data-tab="stats">Статистика</button>
                     <button class="tab-btn" data-tab="users">Пользователи</button>
                     <button class="tab-btn" data-tab="orders">Заказы</button>
                </div>
                <div class="tab-content" style="padding-top: 20px;">
                    <div class="tab-pane active" id="stats-tab">Загрузка статистики...</div>
                    <div class="tab-pane" id="users-tab"></div>
                    <div class="tab-pane" id="orders-tab"></div>
                </div>
            </div>
        `;
    }

    async handleAdminLogin(event) {
        event.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                this.isAdmin = true;
                this.showToast('Вход администратора выполнен успешно', 'success');
                this.updateAdminNav();
                this.loadPage('admin');
            } else {
                throw new Error(data.message || 'Неверные учетные данные');
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    getAccessDeniedPage() {
        return `
            <div class="fade-in">
                <div class="glass" style="text-align: center; padding: 60px 40px;">
                    <h2>Доступ запрещен</h2>
                    <p>У вас нет прав для доступа к этой странице</p>
                    <button class="btn primary" onclick="app.loadPage('home')">
                        <i class="fa-solid fa-home"></i>
                        На главную
                    </button>
                </div>
            </div>
        `;
    }
    
    getNotFoundPage() {
        return `
            <div class="fade-in">
                <div class="glass" style="text-align: center; padding: 60px 40px;">
                    <h2>Страница не найдена</h2>
                    <p>Запрашиваемая страница не существует</p>
                    <button class="btn primary" onclick="app.loadPage('home')">
                        <i class="fa-solid fa-home"></i>
                        На главную
                    </button>
                </div>
            </div>
        `;
    }
    
    getErrorPage() {
        return `
            <div class="fade-in">
                <div class="glass" style="text-align: center; padding: 60px 40px;">
                    <h2>Произошла ошибка</h2>
                    <p>Не удалось загрузить содержимое страницы</p>
                    <button class="btn primary" onclick="location.reload()">
                        <i class="fa-solid fa-refresh"></i>
                        Обновить страницу
                    </button>
                </div>
            </div>
        `;
    }
    
    // Event Binding
    bindPageEvents() {
        // Service category filtering
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                this.filterServices(category);
                
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Support form
        const supportForm = document.getElementById('support-form');
        if (supportForm) {
            supportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitSupportTicket();
            });
        }
        
        // Cabinet tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchCabinetTab(tab);
                
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                document.getElementById(`${tab}-tab`).classList.add('active');
            });
        });
        
        // Load cabinet data if user is logged in
        if (this.currentUser && this.currentPage === 'cabinet') {
            this.loadUserOrders();
        } else if (!this.currentUser && this.currentPage === 'cabinet') {
            this.renderGoogleButton();
        }
        
        // Admin login form
        const adminLoginForm = document.getElementById('admin-login-form');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', this.handleAdminLogin.bind(this));
        }

        // If on admin dashboard, load initial tab
        if (this.isAdmin && this.currentPage === 'admin') {
            this.loadAdminStats(); // Загружаем первую вкладку по умолчанию
            document.querySelectorAll('.profile-tabs .tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.dataset.tab;
                    document.querySelectorAll('.profile-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                    document.getElementById(`${tab}-tab`).classList.add('active');

                    if (tab === 'stats') this.loadAdminStats();
                });
            });
        }
        
        // Update language
        updatePageLanguage();
    }
    
    // Service Functions
    filterServices(category) {
        const serviceItems = document.querySelectorAll('.service-item');
        serviceItems.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    orderService(serviceId) {
        if (!this.currentUser) {
            this.showToast('Необходимо войти в систему для заказа услуг', 'error');
            return;
        }
        
        const service = this.services.find(s => s.service_id === serviceId);
        if (!service) {
            this.showToast('Услуга не найдена', 'error');
            return;
        }
        
        const orderData = {
            user_id: this.currentUser.user_id,
            service_id: serviceId,
            serviceName: service.name,
            serviceDescription: service.description,
            priceUsd: service.price_usd,
            priceEur: service.price_eur,
            priceUah: service.price_uah,
            priceCoins: service.price_coins
        };
        
        if (window.paymentSystem) {
            window.paymentSystem.processPayment(orderData);
        } else {
            this.showToast('Система оплаты недоступна', 'error');
        }
    }
    
    showReviews(serviceId) {
        this.showToast('Функция отзывов в разработке', 'info');
    }
    
    // Auth Functions
    initializeAuth() {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                this.isAdmin = this.currentUser.is_admin || false;
                this.updateAdminNav();
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
                localStorage.removeItem('user');
            }
        }

        google.accounts.id.initialize({
            client_id: this.googleClientId,
            callback: this.handleGoogleCredentialResponse.bind(this)
        });
    }

    async handleGoogleCredentialResponse(response) {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential })
            });

            const data = await res.json();

            if (res.ok) {
                this.currentUser = data.user;
                this.isAdmin = data.is_admin || false;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                this.showToast('Вход выполнен успешно!', 'success');
                this.updateAdminNav();
                if (this.currentPage === 'cabinet') {
                    this.loadPage('cabinet');
                }
            } else {
                throw new Error(data.message || 'Ошибка аутентификации');
            }
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            this.showToast(error.message, 'error');
        }
    }
    
    renderGoogleButton() {
        const container = document.getElementById('google-signin-container');
        if (container) {
            google.accounts.id.renderButton(container, {
                theme: "outline",
                size: "large",
                text: "signin_with",
                shape: "rectangular"
            });
        }
    }

    updateAdminNav() {
        const adminLink = document.getElementById('admin-nav-link');
        if (adminLink) {
            adminLink.style.display = this.isAdmin ? 'flex' : 'none';
        }
    }

    signOut() {
        this.currentUser = null;
        this.isAdmin = false;
        localStorage.removeItem('user');
        google.accounts.id.disableAutoSelect();
        this.showToast('Вы вышли из системы', 'success');
        this.updateAdminNav();
        this.loadPage(this.currentPage); 
    }
    
    // Cabinet Functions
    switchCabinetTab(tab) {
        switch (tab) {
            case 'orders':
                this.loadUserOrders();
                break;
            case 'transactions':
                this.loadUserTransactions();
                break;
            case 'support':
                this.loadUserSupportTickets();
                break;
        }
    }
    
    async loadUserOrders() {
        if (!this.currentUser) return;
        
        const container = document.getElementById('user-orders');
        if (!container) return;
        
        try {
            const response = await fetch(`/api/orders/user/${this.currentUser.user_id}`);
            if (response.ok) {
                const orders = await response.json();
                container.innerHTML = orders.length ? 
                    orders.map(order => this.renderOrderItem(order)).join('') :
                    '<p>У вас пока нет заказов</p>';
            } else {
                container.innerHTML = '<p>Ошибка загрузки заказов</p>';
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            container.innerHTML = '<p>Ошибка загрузки заказов</p>';
        }
    }
    
    renderOrderItem(order) {
        const statusColors = {
            pending: 'pending',
            in_progress: 'in_progress',
            completed: 'completed',
            cancelled: 'cancelled'
        };
        
        return `
            <div class="order-item">
                <div class="order-header">
                    <h4>Заказ #${order.order_id}</h4>
                    <span class="status-badge ${statusColors[order.status] || 'pending'}">${order.status}</span>
                </div>
                <p><strong>Услуга:</strong> ${order.service_name}</p>
                <p><strong>Дата:</strong> ${new Date(order.creation_date).toLocaleDateString()}</p>
                <p><strong>Сумма:</strong> ${order.coins_paid ? `${order.coins_paid} монет` : `$${order.price_paid}`}</p>
            </div>
        `;
    }
    
    async loadUserTransactions() {
        if (!this.currentUser) return;
        
        const container = document.getElementById('user-transactions');
        if (!container) return;
        
        container.innerHTML = '<p>Загрузка транзакций...</p>';
        
        try {
            const response = await fetch(`/api/coins/transactions/${this.currentUser.user_id}`);
            if (response.ok) {
                const transactions = await response.json();
                container.innerHTML = transactions.length ?
                    transactions.map(t => this.renderTransactionItem(t)).join('') :
                    '<p>Транзакций пока нет</p>';
            } else {
                container.innerHTML = '<p>Ошибка загрузки транзакций</p>';
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            container.innerHTML = '<p>Ошибка загрузки транзакций</p>';
        }
    }
    
    renderTransactionItem(transaction) {
        const typeColors = {
            purchase: 'success',
            spend: 'danger',
            refund: 'info',
            bonus: 'warning'
        };
        
        return `
            <div class="transaction-item">
                <div class="transaction-header">
                    <span class="transaction-type ${typeColors[transaction.transaction_type]}">${transaction.transaction_type}</span>
                    <span class="transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}">
                        ${transaction.amount > 0 ? '+' : ''}${transaction.amount} монет
                    </span>
                </div>
                <p>${transaction.description}</p>
                <small>${new Date(transaction.creation_date).toLocaleString()}</small>
            </div>
        `;
    }
    
    async loadUserSupportTickets() {
        if (!this.currentUser) return;
        
        const container = document.getElementById('user-support-tickets');
        if (!container) return;
        
        container.innerHTML = '<p>Загрузка тикетов...</p>';
        
        try {
            const response = await fetch(`/api/support/tickets/user/${this.currentUser.user_id}`);
            if (response.ok) {
                const tickets = await response.json();
                container.innerHTML = tickets.length ?
                    tickets.map(t => this.renderSupportTicketItem(t)).join('') :
                    '<p>Обращений в поддержку пока нет</p>';
            } else {
                container.innerHTML = '<p>Ошибка загрузки тикетов</p>';
            }
        } catch (error) {
            console.error('Error loading support tickets:', error);
            container.innerHTML = '<p>Ошибка загрузки тикетов</p>';
        }
    }
    
    renderSupportTicketItem(ticket) {
        return `
            <div class="support-ticket-item">
                <div class="ticket-header">
                    <h4>Тикет #${ticket.ticket_id}</h4>
                    <span class="status-badge ${ticket.status}">${ticket.status}</span>
                </div>
                <p><strong>Категория:</strong> ${ticket.category}</p>
                <p><strong>Тема:</strong> ${ticket.subject}</p>
                <p><strong>Дата:</strong> ${new Date(ticket.creation_date).toLocaleDateString()}</p>
                ${ticket.admin_response ? `<div class="admin-response"><strong>Ответ:</strong> ${ticket.admin_response}</div>` : ''}
            </div>
        `;
    }
    
    // Support
    async submitSupportTicket() {
        if (!this.currentUser) {
            this.showToast('Необходимо войти в систему', 'error');
            return;
        }
        
        const category = document.getElementById('support-category').value;
        const subject = document.getElementById('support-subject').value;
        const message = document.getElementById('support-message').value;
        
        if (!category || !subject || !message) {
            this.showToast('Заполните все поля', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.currentUser.user_id,
                    category,
                    subject,
                    message
                })
            });
            
            if (response.ok) {
                this.showToast('Обращение отправлено успешно', 'success');
                document.getElementById('support-form').reset();
            } else {
                this.showToast('Ошибка отправки обращения', 'error');
            }
        } catch (error) {
            console.error('Error submitting support ticket:', error);
            this.showToast('Ошибка отправки обращения', 'error');
        }
    }
    
    // Gemini Chat
    async sendGeminiMessage() {
        const input = document.getElementById('gemini-input');
        const messagesContainer = document.getElementById('gemini-messages');
        
        if (!input || !messagesContainer) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Add user message
        this.addChatMessage(messagesContainer, message, 'user');
        input.value = '';
        
        // Add typing indicator
        const typingMessage = this.addChatMessage(messagesContainer, 'Печатает...', 'bot typing');
        
        try {
            const response = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    user_id: this.currentUser?.user_id
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                typingMessage.remove();
                this.addChatMessage(messagesContainer, data.reply, 'bot');
            } else {
                typingMessage.textContent = 'Ошибка получения ответа';
                typingMessage.classList.remove('typing');
            }
        } catch (error) {
            console.error('Gemini chat error:', error);
            typingMessage.textContent = 'Ошибка соединения';
            typingMessage.classList.remove('typing');
        }
    }
    
    addChatMessage(container, text, role) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.textContent = text;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        return messageDiv;
    }

    async loadAdminStats() {
        const container = document.getElementById('stats-tab');
        if (!container) return;

        try {
            const response = await fetch('/api/admin/stats');
            if (!response.ok) throw new Error('Failed to load stats');
            
            const stats = await response.json();
            
            container.innerHTML = `
                <div class="status-grid">
                    <div class="status-card glass">
                        <div class="label">Всего пользователей</div>
                        <div class="value">${stats.total_users}</div>
                    </div>
                    <div class="status-card glass">
                        <div class="label">Всего заказов</div>
                        <div class="value">${stats.total_orders}</div>
                    </div>
                    <div class="status-card glass">
                        <div class="label">Общий доход</div>
                        <div class="value">$${stats.total_revenue.toFixed(2)}</div>
                    </div>
                    <div class="status-card glass">
                        <div class="label">Открытые тикеты</div>
                        <div class="value">${stats.open_support_tickets}</div>
                    </div>
                </div>
                <div class="admin-card glass" style="margin-top: 20px;">
                    <h3>Популярные услуги</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${stats.popular_services.map(s => `<li>${s.name} - ${s.order_count} заказов</li>`).join('')}
                    </ul>
                </div>
            `;

        } catch (error) {
            container.innerHTML = `<p>Ошибка загрузки статистики: ${error.message}</p>`;
        }
    }
    
    // Settings
    loadSettings() {
        const defaultSettings = {
            theme: 'dark',
            language: 'ru',
            particles: true,
            navStyle: 'dock-bottom'
        };
        
        try {
            const saved = localStorage.getItem('settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }
    
    saveSettings() {
        const settings = {
            theme: document.documentElement.getAttribute('data-theme'),
            language: currentLanguage,
            particles: document.getElementById('particles-toggle')?.checked ?? true,
            navStyle: document.querySelector('nav').className || 'dock-bottom'
        };
        
        localStorage.setItem('settings', JSON.stringify(settings));
        this.settings = settings;
    }
    
    // Toast Notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 400);
        }, 4000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RootzsuApp();
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.app) {
        window.app.showToast('Произошла ошибка приложения', 'error');
    }
});

// Global functions for backward compatibility
function showToast(message, type = 'info') {
    if (window.app) {
        window.app.showToast(message, type);
    }
}

function t(key) {
    return window.t ? window.t(key) : key;
}
