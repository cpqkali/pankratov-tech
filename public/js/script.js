// Enhanced Main Application Script with Preloader Fix
class RootzsuApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.services = [];
        this.isLoading = false;
        this.preloaderTimeout = null;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Rootzsu App...');
            
            // Initialize preloader with timeout fallback
            this.initPreloader();
            
            // Initialize core components
            await this.initializeComponents();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup event listeners
            this.bindEvents();
            
            // Initialize page routing
            this.initRouting();
            
            // Hide preloader after everything is loaded
            this.hidePreloader();
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.hidePreloader();
            this.showToast('Ошибка загрузки приложения', 'error');
        }
    }

    initPreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        // Fallback timeout - hide preloader after 10 seconds max
        this.preloaderTimeout = setTimeout(() => {
            console.warn('⚠️ Preloader timeout - forcing hide');
            this.hidePreloader();
        }, 10000);

        // Show preloader initially
        preloader.style.display = 'flex';
        preloader.style.opacity = '1';
    }

    hidePreloader() {
        const preloader = document.getElementById('preloader');
        const introAnimation = document.getElementById('intro-animation');
        
        // Clear timeout
        if (this.preloaderTimeout) {
            clearTimeout(this.preloaderTimeout);
            this.preloaderTimeout = null;
        }

        if (preloader) {
            preloader.style.transition = 'opacity 0.5s ease-out';
            preloader.style.opacity = '0';
            
            setTimeout(() => {
                preloader.style.display = 'none';
                console.log('✅ Preloader hidden');
            }, 500);
        }

        if (introAnimation) {
            setTimeout(() => {
                introAnimation.style.transition = 'opacity 1s ease-out';
                introAnimation.style.opacity = '0';
                setTimeout(() => {
                    introAnimation.style.display = 'none';
                }, 1000);
            }, 2000);
        }
    }

    async initializeComponents() {
        // Initialize language system
        if (typeof initLanguageSwitcher === 'function') {
            initLanguageSwitcher();
        }
        
        // Initialize particles if enabled
        const particlesEnabled = localStorage.getItem('particles-enabled') !== 'false';
        if (particlesEnabled && window.particleSystem) {
            console.log('🎨 Particles initialized');
        }
        
        // Initialize theme
        this.initTheme();
        
        // Initialize clock
        this.initClock();
        
        // Initialize tooltips
        this.initTooltips();
    }

    async loadInitialData() {
        try {
            // Load services
            await this.loadServices();
            
            // Check user authentication
            await this.checkAuthentication();
            
            // Load user-specific data if authenticated
            if (this.currentUser) {
                await this.loadUserData();
            }
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async loadServices() {
        try {
            const response = await fetch('/api/services');
            if (response.ok) {
                this.services = await response.json();
                console.log(`📋 Loaded ${this.services.length} services`);
            } else {
                console.warn('Failed to load services from API, using fallback');
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
                price_usd: 16.0,
                price_eur: 13.65,
                price_uah: 661.0,
                price_coins: 160,
                difficulty_level: "advanced",
                estimated_time: "1-2 hours"
            },
            {
                service_id: 2,
                name: "Установка root-прав",
                description: "Получение root доступа на Android устройствах",
                category: "advanced",
                price_usd: 3.0,
                price_eur: 2.56,
                price_uah: 124.0,
                price_coins: 30,
                difficulty_level: "intermediate",
                estimated_time: "30-60 minutes"
            },
            {
                service_id: 3,
                name: "Прошивка устройств",
                description: "Установка кастомных прошивок и восстановление системы",
                category: "advanced",
                price_usd: 20.0,
                price_eur: 17.06,
                price_uah: 826.0,
                price_coins: 200,
                difficulty_level: "expert",
                estimated_time: "2-4 hours"
            }
        ];
    }

    async checkAuthentication() {
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUserInterface();
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('userData');
            }
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            // Load user orders
            const ordersResponse = await fetch(`/api/orders/user/${this.currentUser.user_id}`);
            if (ordersResponse.ok) {
                this.currentUser.orders = await ordersResponse.json();
            }
            
            // Load user coins
            const coinsResponse = await fetch(`/api/user/${this.currentUser.user_id}/coins`);
            if (coinsResponse.ok) {
                const coinsData = await coinsResponse.json();
                this.currentUser.coins = coinsData.coins;
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    bindEvents() {
        // Navigation events
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').substring(1);
                this.navigateTo(page);
            });
        });

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Chat button
        const chatBtn = document.getElementById('chat-button');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => this.showGeminiChat());
        }

        // Modal close events
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-container');
                if (modal) {
                    modal.classList.remove('show');
                }
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal-container').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });

        // Support form
        const supportForm = document.getElementById('support-form');
        if (supportForm) {
            supportForm.addEventListener('submit', (e) => this.handleSupportSubmit(e));
        }

        // Gemini chat form
        const geminiForm = document.getElementById('gemini-form');
        if (geminiForm) {
            geminiForm.addEventListener('submit', (e) => this.handleGeminiSubmit(e));
        }
    }

    initRouting() {
        // Handle initial route
        const hash = window.location.hash.substring(1) || 'home';
        this.navigateTo(hash);

        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.substring(1) || 'home';
            this.navigateTo(page);
        });
    }

    navigateTo(page) {
        if (this.currentPage === page) return;
        
        console.log(`🧭 Navigating to: ${page}`);
        this.currentPage = page;
        
        // Update URL
        window.location.hash = page;
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[href="#${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Load page content
        this.loadPageContent(page);
    }

    async loadPageContent(page) {
        const app = document.getElementById('app');
        if (!app) return;

        this.isLoading = true;
        app.innerHTML = '<div class="loading">Загрузка...</div>';

        try {
            let content = '';
            
            switch (page) {
                case 'home':
                    content = this.getHomeContent();
                    break;
                case 'services':
                    content = this.getServicesContent();
                    break;
                case 'service-details':
                    content = this.getServiceDetailsContent();
                    break;
                case 'team':
                    content = this.getTeamContent();
                    break;
                case 'cabinet':
                    content = this.getCabinetContent();
                    break;
                case 'status':
                    content = await this.getStatusContent();
                    break;
                case 'support':
                    content = this.getSupportContent();
                    break;
                case 'admin':
                    if (this.currentUser && this.currentUser.is_admin) {
                        window.location.href = '/pages/admin.html';
                        return;
                    } else {
                        content = '<div class="error-message">Доступ запрещен</div>';
                    }
                    break;
                default:
                    content = '<div class="error-message">Страница не найдена</div>';
            }
            
            app.innerHTML = content;
            this.bindPageEvents(page);
            
        } catch (error) {
            console.error(`Error loading page ${page}:`, error);
            app.innerHTML = '<div class="error-message">Ошибка загрузки страницы</div>';
        } finally {
            this.isLoading = false;
        }
    }

    getHomeContent() {
        return `
            <div class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title" data-lang-key="welcome_title">Добро пожаловать в ROOTZSU</h1>
                    <p class="hero-subtitle" data-lang-key="welcome_subtitle">Профессиональные IT-услуги и техническая поддержка</p>
                    <p class="hero-description" data-lang-key="hero_description">
                        Мы предоставляем высококачественные услуги по настройке устройств, установке ПО и технической поддержке. 
                        Наша команда экспертов готова решить любые технические задачи с мобильными устройствами и компьютерами.
                    </p>
                    <div class="hero-actions">
                        <button class="btn primary" onclick="app.navigateTo('services')" data-lang-key="get_started">
                            <i class="fa-solid fa-rocket"></i>
                            Начать работу
                        </button>
                        <button class="btn secondary" onclick="app.navigateTo('service-details')" data-lang-key="learn_more">
                            <i class="fa-solid fa-info-circle"></i>
                            Узнать больше
                        </button>
                    </div>
                </div>
            </div>

            <div class="stats-section">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fa-solid fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="stats-users">1250+</h3>
                            <p data-lang-key="stats_users">Пользователей</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fa-solid fa-shopping-cart"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="stats-orders">340+</h3>
                            <p data-lang-key="stats_orders">Заказов</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fa-solid fa-cogs"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="stats-services">15+</h3>
                            <p data-lang-key="stats_services">Услуг</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fa-solid fa-heart"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="stats-satisfaction">98%</h3>
                            <p data-lang-key="stats_satisfaction">Довольных клиентов</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="features-section">
                <h2 class="section-title" data-lang-key="features_title">Наши преимущества</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fa-solid fa-award"></i>
                        </div>
                        <h3 data-lang-key="feature_quality">Высокое качество</h3>
                        <p data-lang-key="feature_quality_desc">Профессиональный подход к каждому заказу с гарантией качества</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fa-solid fa-bolt"></i>
                        </div>
                        <h3 data-lang-key="feature_speed">Быстрое выполнение</h3>
                        <p data-lang-key="feature_speed_desc">Оперативное решение ваших задач в кратчайшие сроки</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fa-solid fa-headset"></i>
                        </div>
                        <h3 data-lang-key="feature_support">24/7 Поддержка</h3>
                        <p data-lang-key="feature_support_desc">Круглосуточная техническая поддержка и консультации</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fa-solid fa-dollar-sign"></i>
                        </div>
                        <h3 data-lang-key="feature_price">Доступные цены</h3>
                        <p data-lang-key="feature_price_desc">Конкурентные цены на все виды услуг</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fa-solid fa-shield-alt"></i>
                        </div>
                        <h3 data-lang-key="feature_security">Безопасность</h3>
                        <p data-lang-key="feature_security_desc">Полная конфиденциальность и безопасность ваших данных</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fa-solid fa-certificate"></i>
                        </div>
                        <h3 data-lang-key="feature_warranty">Гарантия</h3>
                        <p data-lang-key="feature_warranty_desc">Гарантия на все выполненные работы</p>
                    </div>
                </div>
            </div>
        `;
    }

    getServicesContent() {
        const basicServices = this.services.filter(s => s.category === 'basic');
        const advancedServices = this.services.filter(s => s.category === 'advanced');

        return `
            <div class="services-section">
                <h2 class="section-title" data-lang-key="services_title">Наши услуги</h2>
                
                <div class="services-categories">
                    <div class="category-section">
                        <h3 class="category-title" data-lang-key="service_basic">
                            <i class="fa-solid fa-star"></i>
                            Базовые услуги
                        </h3>
                        <div class="services-grid">
                            ${basicServices.map(service => this.createServiceCard(service)).join('')}
                        </div>
                    </div>
                    
                    <div class="category-section">
                        <h3 class="category-title" data-lang-key="service_advanced">
                            <i class="fa-solid fa-rocket"></i>
                            Продвинутые услуги
                        </h3>
                        <div class="services-grid">
                            ${advancedServices.map(service => this.createServiceCard(service)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createServiceCard(service) {
        const difficultyColors = {
            'beginner': 'success',
            'intermediate': 'warning',
            'advanced': 'danger',
            'expert': 'purple'
        };

        return `
            <div class="service-card" data-service-id="${service.service_id}">
                <div class="service-header">
                    <h4 class="service-name">${service.name}</h4>
                    <span class="difficulty-badge ${difficultyColors[service.difficulty_level] || 'primary'}">
                        ${service.difficulty_level}
                    </span>
                </div>
                <p class="service-description">${service.description}</p>
                <div class="service-details">
                    <div class="service-time">
                        <i class="fa-solid fa-clock"></i>
                        ${service.estimated_time}
                    </div>
                </div>
                <div class="service-pricing">
                    <div class="price-row">
                        <span>💵 USD:</span>
                        <span class="price">$${service.price_usd}</span>
                    </div>
                    <div class="price-row">
                        <span>💶 EUR:</span>
                        <span class="price">€${service.price_eur}</span>
                    </div>
                    <div class="price-row">
                        <span>₴ UAH:</span>
                        <span class="price">₴${service.price_uah}</span>
                    </div>
                    <div class="price-row coins">
                        <span>🪙 Coins:</span>
                        <span class="price">${service.price_coins}</span>
                    </div>
                </div>
                <div class="service-actions">
                    <button class="btn primary" onclick="app.orderService(${service.service_id})" data-lang-key="order_service">
                        <i class="fa-solid fa-shopping-cart"></i>
                        Заказать
                    </button>
                    <button class="btn secondary" onclick="app.showServiceReviews(${service.service_id})">
                        <i class="fa-solid fa-star"></i>
                        Отзывы
                    </button>
                </div>
            </div>
        `;
    }

    getCabinetContent() {
        if (!this.currentUser) {
            return `
                <div class="cabinet-section">
                    <div class="login-container">
                        <h2 data-lang-key="login_required">Необходимо войти в систему</h2>
                        <p data-lang-key="login_description">Войдите в свой аккаунт для доступа к личному кабинету</p>
                        <div id="g_id_onload"
                             data-client_id="957687109285-gs24ojtjhjkatpi7n0rrpb1c57tf95e2.apps.googleusercontent.com"
                             data-callback="handleGoogleLogin"
                             data-auto_prompt="false">
                        </div>
                        <div class="g_id_signin" data-type="standard" data-size="large" data-theme="outline" data-text="sign_in_with" data-shape="rectangular" data-logo_alignment="left"></div>
                    </div>
                </div>
            `;
        }

        const orders = this.currentUser.orders || [];
        const coins = this.currentUser.coins || 0;

        return `
            <div class="cabinet-section">
                <div class="cabinet-header">
                    <div class="user-info">
                        <img src="${this.currentUser.avatar_url || '/images/default-avatar.png'}" alt="Avatar" class="user-avatar">
                        <div class="user-details">
                            <h2>${this.currentUser.first_name} ${this.currentUser.last_name || ''}</h2>
                            <p>${this.currentUser.email}</p>
                            <div class="user-coins">
                                <i class="fa-solid fa-coins"></i>
                                <span>${coins} монет</span>
                            </div>
                        </div>
                    </div>
                    <div class="cabinet-actions">
                        <button class="btn secondary" onclick="app.logout()">
                            <i class="fa-solid fa-sign-out-alt"></i>
                            Выйти
                        </button>
                    </div>
                </div>

                <div class="cabinet-content">
                    <div class="cabinet-tabs">
                        <button class="tab-btn active" data-tab="orders">
                            <i class="fa-solid fa-shopping-cart"></i>
                            Мои заказы
                        </button>
                        <button class="tab-btn" data-tab="coins">
                            <i class="fa-solid fa-coins"></i>
                            Монеты
                        </button>
                        <button class="tab-btn" data-tab="support">
                            <i class="fa-solid fa-headset"></i>
                            Поддержка
                        </button>
                    </div>

                    <div class="tab-content active" id="orders-tab">
                        <h3 data-lang-key="my_orders">Мои заказы</h3>
                        ${orders.length > 0 ? `
                            <div class="orders-list">
                                ${orders.map(order => `
                                    <div class="order-card">
                                        <div class="order-header">
                                            <span class="order-id">#${order.order_id}</span>
                                            <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span>
                                        </div>
                                        <h4>${order.service_name}</h4>
                                        <div class="order-details">
                                            <div class="order-price">
                                                ${order.coins_paid > 0 ? `${order.coins_paid} монет` : `$${order.price_paid}`}
                                            </div>
                                            <div class="order-date">${new Date(order.creation_date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p>У вас пока нет заказов</p>'}
                    </div>

                    <div class="tab-content" id="coins-tab">
                        <h3>Управление монетами</h3>
                        <div class="coins-info">
                            <div class="current-balance">
                                <h4>Текущий баланс: ${coins} монет</h4>
                            </div>
                            <div class="coins-purchase">
                                <h4>Купить монеты</h4>
                                <div class="coins-packages">
                                    <div class="coin-package" onclick="app.purchaseCoins(10, 100)">
                                        <div class="package-coins">100 монет</div>
                                        <div class="package-price">$10</div>
                                    </div>
                                    <div class="coin-package" onclick="app.purchaseCoins(25, 250)">
                                        <div class="package-coins">250 монет</div>
                                        <div class="package-price">$25</div>
                                    </div>
                                    <div class="coin-package" onclick="app.purchaseCoins(50, 500)">
                                        <div class="package-coins">500 монет</div>
                                        <div class="package-price">$50</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="tab-content" id="support-tab">
                        <h3>Техническая поддержка</h3>
                        <form class="support-form" onsubmit="app.submitSupportTicket(event)">
                            <div class="form-group">
                                <label>Категория</label>
                                <select name="category" required>
                                    <option value="technical">Техническая проблема</option>
                                    <option value="billing">Вопрос по оплате</option>
                                    <option value="service">Вопрос по услуге</option>
                                    <option value="other">Другое</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Тема</label>
                                <input type="text" name="subject" required>
                            </div>
                            <div class="form-group">
                                <label>Сообщение</label>
                                <textarea name="message" rows="5" required></textarea>
                            </div>
                            <button type="submit" class="btn primary">
                                <i class="fa-solid fa-paper-plane"></i>
                                Отправить
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    async getStatusContent() {
        try {
            const response = await fetch('/api/status');
            const status = response.ok ? await response.json() : null;

            return `
                <div class="status-section">
                    <h2 class="section-title">Статус системы</h2>
                    
                    <div class="status-grid">
                        <div class="status-card">
                            <div class="status-header">
                                <h3>Сервер</h3>
                                <span class="status-indicator ${status ? 'online' : 'offline'}"></span>
                            </div>
                            <div class="status-details">
                                ${status ? `
                                    <div class="status-item">
                                        <span>CPU:</span>
                                        <span>${status.cpu_usage}%</span>
                                    </div>
                                    <div class="status-item">
                                        <span>RAM:</span>
                                        <span>${status.ram_usage}%</span>
                                    </div>
                                    <div class="status-item">
                                        <span>Uptime:</span>
                                        <span>${status.uptime_hours}h</span>
                                    </div>
                                ` : '<p>Сервер недоступен</p>'}
                            </div>
                        </div>

                        <div class="status-card">
                            <div class="status-header">
                                <h3>Telegram Bot</h3>
                                <span class="status-indicator ${status?.bot_online ? 'online' : 'offline'}"></span>
                            </div>
                            <div class="status-details">
                                <p>${status?.bot_online ? 'Бот работает нормально' : 'Бот недоступен'}</p>
                                <a href="https://t.me/rootzsu_bot" target="_blank" class="btn secondary">
                                    <i class="fa-brands fa-telegram"></i>
                                    Открыть бота
                                </a>
                            </div>
                        </div>

                        <div class="status-card">
                            <div class="status-header">
                                <h3>Статистика</h3>
                            </div>
                            <div class="status-details">
                                ${status ? `
                                    <div class="status-item">
                                        <span>Пользователи:</span>
                                        <span>${status.user_count}</span>
                                    </div>
                                    <div class="status-item">
                                        <span>Активные заказы:</span>
                                        <span>${status.active_orders}</span>
                                    </div>
                                    <div class="status-item">
                                        <span>Выполнено заказов:</span>
                                        <span>${status.completed_orders}</span>
                                    </div>
                                ` : '<p>Статистика недоступна</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading status:', error);
            return `
                <div class="status-section">
                    <h2 class="section-title">Статус системы</h2>
                    <div class="error-message">Ошибка загрузки статуса системы</div>
                </div>
            `;
        }
    }

    getServiceDetailsContent() {
        return `
            <div class="service-details-section">
                <h2 class="section-title" data-lang-key="service_details_title">Подробное описание услуг</h2>
                
                <div class="service-details-grid">
                    <div class="service-detail-card">
                        <div class="service-detail-icon">
                            <i class="fa-solid fa-unlock"></i>
                        </div>
                        <h3 data-lang-key="bootloader_unlock_title">Разблокировка загрузчика</h3>
                        <p data-lang-key="bootloader_unlock_desc">
                            Разблокировка загрузчика (Bootloader Unlock) - это процедура, которая позволяет получить полный контроль над вашим Android-устройством. 
                            После разблокировки вы сможете устанавливать кастомные прошивки, получать root-права и модифицировать системные файлы.
                        </p>
                        <div class="service-features">
                            <h4>Что включает:</h4>
                            <ul>
                                <li>Диагностика устройства</li>
                                <li>Разблокировка bootloader</li>
                                <li>Установка кастомного recovery</li>
                                <li>Тестирование работоспособности</li>
                            </ul>
                        </div>
                    </div>

                    <div class="service-detail-card">
                        <div class="service-detail-icon">
                            <i class="fa-solid fa-user-shield"></i>
                        </div>
                        <h3 data-lang-key="root_installation_title">Установка root-прав</h3>
                        <p data-lang-key="root_installation_desc">
                            Root-права дают вам административный доступ к операционной системе Android. 
                            С root-правами вы можете удалять системные приложения, устанавливать специальные программы, 
                            изменять системные настройки и получить полный контроль над устройством.
                        </p>
                        <div class="service-features">
                            <h4>Возможности после получения root:</h4>
                            <ul>
                                <li>Удаление системных приложений</li>
                                <li>Полный доступ к файловой системе</li>
                                <li>Установка специализированных приложений</li>
                                <li>Тонкая настройка системы</li>
                            </ul>
                        </div>
                    </div>

                    <div class="service-detail-card">
                        <div class="service-detail-icon">
                            <i class="fa-solid fa-microchip"></i>
                        </div>
                        <h3 data-lang-key="custom_rom_title">Прошивка устройств</h3>
                        <p data-lang-key="custom_rom_desc">
                            Установка кастомных прошивок позволяет полностью изменить операционную систему вашего устройства. 
                            Мы устанавливаем популярные прошивки как LineageOS, Pixel Experience, MIUI и другие, 
                            что дает новые функции и улучшенную производительность.
                        </p>
                        <div class="service-features">
                            <h4>Популярные прошивки:</h4>
                            <ul>
                                <li>LineageOS - стабильная и чистая система</li>
                                <li>Pixel Experience - интерфейс Google Pixel</li>
                                <li>MIUI - функциональная система от Xiaomi</li>
                                <li>OxygenOS - быстрая система от OnePlus</li>
                            </ul>
                        </div>
                    </div>

                    <div class="service-detail-card">
                        <div class="service-detail-icon">
                            <i class="fa-solid fa-desktop"></i>
                        </div>
                        <h3 data-lang-key="os_installation_title">Установка ОС (ПК)</h3>
                        <p data-lang-key="os_installation_desc">
                            Профессиональная установка операционных систем Windows (7, 10, 11) и Linux (Ubuntu, Debian, Arch). 
                            Включает настройку драйверов, установку необходимого ПО и оптимизацию системы для максимальной производительности.
                        </p>
                        <div class="service-features">
                            <h4>Поддерживаемые ОС:</h4>
                            <ul>
                                <li>Windows 10/11 - современные версии</li>
                                <li>Ubuntu - популярный Linux дистрибутив</li>
                                <li>Debian - стабильная система</li>
                                <li>Arch Linux - для продвинутых пользователей</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getTeamContent() {
        return `
            <div class="team-section">
                <h2 class="section-title">Наша команда</h2>
                
                <div class="team-grid">
                    <div class="team-member">
                        <div class="member-avatar">
                            <i class="fa-solid fa-user-tie"></i>
                        </div>
                        <h3>Александр</h3>
                        <p class="member-role">Основатель & Lead Developer</p>
                        <p class="member-description">
                            Более 8 лет опыта в области мобильных технологий и системного администрирования. 
                            Специализируется на Android-разработке и восстановлении устройств.
                        </p>
                        <div class="member-skills">
                            <span class="skill-tag">Android</span>
                            <span class="skill-tag">Python</span>
                            <span class="skill-tag">Linux</span>
                            <span class="skill-tag">Recovery</span>
                        </div>
                        <div class="member-social">
                            <a href="https://t.me/rootzsu" target="_blank">
                                <i class="fa-brands fa-telegram"></i>
                            </a>
                            <a href="https://github.com/cpqkali" target="_blank">
                                <i class="fa-brands fa-github"></i>
                            </a>
                        </div>
                    </div>

                    <div class="team-member">
                        <div class="member-avatar">
                            <i class="fa-solid fa-user-cog"></i>
                        </div>
                        <h3>Техническая команда</h3>
                        <p class="member-role">Специалисты по восстановлению</p>
                        <p class="member-description">
                            Команда опытных специалистов, которые занимаются сложными случаями восстановления устройств, 
                            установкой кастомных прошивок и решением нестандартных задач.
                        </p>
                        <div class="member-skills">
                            <span class="skill-tag">EDL Recovery</span>
                            <span class="skill-tag">Fastboot</span>
                            <span class="skill-tag">Custom ROMs</span>
                            <span class="skill-tag">Bootloader</span>
                        </div>
                    </div>

                    <div class="team-member">
                        <div class="member-avatar">
                            <i class="fa-solid fa-headset"></i>
                        </div>
                        <h3>Служба поддержки</h3>
                        <p class="member-role">24/7 Support Team</p>
                        <p class="member-description">
                            Наша служба поддержки работает круглосуточно, чтобы помочь вам с любыми вопросами. 
                            Быстрые ответы, профессиональные консультации и индивидуальный подход к каждому клиенту.
                        </p>
                        <div class="member-skills">
                            <span class="skill-tag">Customer Support</span>
                            <span class="skill-tag">Technical Consulting</span>
                            <span class="skill-tag">Problem Solving</span>
                        </div>
                    </div>
                </div>

                <div class="team-stats">
                    <div class="team-stat">
                        <h3>8+</h3>
                        <p>Лет опыта</p>
                    </div>
                    <div class="team-stat">
                        <h3>1000+</h3>
                        <p>Восстановленных устройств</p>
                    </div>
                    <div class="team-stat">
                        <h3>24/7</h3>
                        <p>Техническая поддержка</p>
                    </div>
                    <div class="team-stat">
                        <h3>98%</h3>
                        <p>Успешных восстановлений</p>
                    </div>
                </div>
            </div>
        `;
    }

    getSupportContent() {
        return `
            <div class="support-section">
                <h2 class="section-title">Техническая поддержка</h2>
                
                <div class="support-options">
                    <div class="support-option">
                        <div class="support-icon">
                            <i class="fa-brands fa-telegram"></i>
                        </div>
                        <h3>Telegram Bot</h3>
                        <p>Самый быстрый способ связаться с нами. Бот работает 24/7 и может помочь с заказами и базовыми вопросами.</p>
                        <a href="https://t.me/rootzsu_bot" target="_blank" class="btn primary">
                            <i class="fa-brands fa-telegram"></i>
                            Открыть бота
                        </a>
                    </div>

                    <div class="support-option">
                        <div class="support-icon">
                            <i class="fa-solid fa-comments"></i>
                        </div>
                        <h3>AI Ассистент</h3>
                        <p>Умный помощник, который может ответить на технические вопросы и помочь с выбором услуги.</p>
                        <button class="btn primary" onclick="app.showGeminiChat()">
                            <i class="fa-solid fa-brain"></i>
                            Начать чат
                        </button>
                    </div>

                    <div class="support-option">
                        <div class="support-icon">
                            <i class="fa-solid fa-envelope"></i>
                        </div>
                        <h3>Форма обратной связи</h3>
                        <p>Отправьте нам подробное описание вашей проблемы, и мы свяжемся с вами в ближайшее время.</p>
                        <button class="btn primary" onclick="app.showSupportModal()">
                            <i class="fa-solid fa-paper-plane"></i>
                            Написать нам
                        </button>
                    </div>
                </div>

                <div class="faq-section">
                    <h3>Часто задаваемые вопросы</h3>
                    <div class="faq-list">
                        <div class="faq-item">
                            <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
                                <h4>Безопасно ли разблокировать загрузчик?</h4>
                                <i class="fa-solid fa-chevron-down"></i>
                            </div>
                            <div class="faq-answer">
                                <p>Разблокировка загрузчика - это безопасная процедура, если выполняется профессионалами. Мы используем только проверенные методы и предоставляем гарантию на все работы.</p>
                            </div>
                        </div>

                        <div class="faq-item">
                            <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
                                <h4>Сколько времени занимает восстановление устройства?</h4>
                                <i class="fa-solid fa-chevron-down"></i>
                            </div>
                            <div class="faq-answer">
                                <p>Время восстановления зависит от сложности проблемы. Простые случаи - 1-2 часа, сложные могут занять до 24 часов. Мы всегда информируем о примерных сроках заранее.</p>
                            </div>
                        </div>

                        <div class="faq-item">
                            <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
                                <h4>Какие устройства вы поддерживаете?</h4>
                                <i class="fa-solid fa-chevron-down"></i>
                            </div>
                            <div class="faq-answer">
                                <p>Мы работаем с большинством Android-устройств: Samsung, Xiaomi, OnePlus, Google Pixel, Huawei, Honor и многими другими. Также предоставляем услуги по установке ОС на ПК.</p>
                            </div>
                        </div>

                        <div class="faq-item">
                            <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
                                <h4>Предоставляете ли вы гарантию?</h4>
                                <i class="fa-solid fa-chevron-down"></i>
                            </div>
                            <div class="faq-answer">
                                <p>Да, мы предоставляем гарантию на все выполненные работы. Если что-то пойдет не так по нашей вине, мы бесплатно исправим проблему.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindPageEvents(page) {
        // Cabinet tab switching
        if (page === 'cabinet') {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabName = btn.dataset.tab;
                    
                    // Update active tab button
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Update active tab content
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    document.getElementById(`${tabName}-tab`).classList.add('active');
                });
            });
        }

        // Update language for new content
        if (typeof updatePageLanguage === 'function') {
            updatePageLanguage();
        }
    }

    // Service ordering
    async orderService(serviceId) {
        if (!this.currentUser) {
            this.showToast('Необходимо войти в систему для заказа услуг', 'warning');
            this.navigateTo('cabinet');
            return;
        }

        const service = this.services.find(s => s.service_id === serviceId);
        if (!service) {
            this.showToast('Услуга не найдена', 'error');
            return;
        }

        if (window.paymentSystem) {
            const orderData = {
                userId: this.currentUser.user_id,
                serviceId: serviceId,
                serviceName: service.name,
                serviceDescription: service.description,
                priceUsd: service.price_usd,
                priceEur: service.price_eur,
                priceUah: service.price_uah,
                priceStars: service.price_coins,
                priceCoins: service.price_coins
            };
            
            await window.paymentSystem.processPayment(orderData);
        } else {
            this.showToast('Система оплаты недоступна', 'error');
        }
    }

    // Show service reviews
    async showServiceReviews(serviceId) {
        try {
            const response = await fetch(`/api/reviews?serviceId=${serviceId}`);
            const reviews = response.ok ? await response.json() : [];
            
            const modal = document.getElementById('reviews-modal');
            const reviewsList = document.getElementById('reviews-list');
            
            if (reviews.length === 0) {
                reviewsList.innerHTML = '<p>Пока нет отзывов для этой услуги</p>';
            } else {
                reviewsList.innerHTML = reviews.map(review => `
                    <div class="review-item">
                        <div class="review-header">
                            <span class="reviewer-name">${review.first_name}</span>
                            <div class="review-rating">
                                ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                            </div>
                        </div>
                        <p class="review-text">${review.review_text}</p>
                        <div class="review-date">${new Date(review.creation_date).toLocaleDateString()}</div>
                    </div>
                `).join('');
            }
            
            modal.classList.add('show');
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.showToast('Ошибка загрузки отзывов', 'error');
        }
    }

    // Purchase coins
    async purchaseCoins(amountUsd, coins) {
        if (!this.currentUser) {
            this.showToast('Необходимо войти в систему', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/coins/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: this.currentUser.user_id,
                    amount_usd: amountUsd
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.showToast(result.message, 'success');
                
                // Update user coins
                this.currentUser.coins = (this.currentUser.coins || 0) + coins;
                this.loadPageContent('cabinet'); // Refresh cabinet
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Ошибка покупки монет', 'error');
            }
        } catch (error) {
            console.error('Error purchasing coins:', error);
            this.showToast('Ошибка покупки монет', 'error');
        }
    }

    // Submit support ticket
    async submitSupportTicket(event) {
        event.preventDefault();
        
        if (!this.currentUser) {
            this.showToast('Необходимо войти в систему', 'warning');
            return;
        }

        const formData = new FormData(event.target);
        const ticketData = {
            user_id: this.currentUser.user_id,
            category: formData.get('category'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        try {
            const response = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ticketData)
            });

            if (response.ok) {
                const result = await response.json();
                this.showToast('Обращение отправлено успешно!', 'success');
                event.target.reset();
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Ошибка отправки обращения', 'error');
            }
        } catch (error) {
            console.error('Error submitting support ticket:', error);
            this.showToast('Ошибка отправки обращения', 'error');
        }
    }

    // Google login handler
    async handleGoogleLogin(response) {
        try {
            const result = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: response.credential })
            });

            const data = await result.json();

            if (result.ok) {
                this.currentUser = data.user;
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
                this.updateUserInterface();
                this.showToast('Вход выполнен успешно!', 'success');
                this.loadPageContent('cabinet');
            } else {
                this.showToast(data.message || 'Ошибка входа', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Ошибка входа в систему', 'error');
        }
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('userData');
        this.updateUserInterface();
        this.showToast('Вы вышли из системы', 'info');
        this.navigateTo('home');
    }

    // Update user interface based on auth status
    updateUserInterface() {
        const adminNavLink = document.getElementById('admin-nav-link');
        if (adminNavLink) {
            adminNavLink.style.display = (this.currentUser && this.currentUser.is_admin) ? 'block' : 'none';
        }
    }

    // Theme management
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        if (window.particleSystem) {
            window.particleSystem.updateTheme(savedTheme);
        }
    }

    // Clock initialization
    initClock() {
        const clockElement = document.getElementById('live-clock');
        if (!clockElement) return;

        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            clockElement.textContent = timeString;
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    // Tooltips initialization
    initTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.getAttribute('data-tooltip');
                document.body.appendChild(tooltip);

                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
                
                setTimeout(() => tooltip.classList.add('show'), 10);
            });

            element.addEventListener('mouseleave', () => {
                document.querySelectorAll('.tooltip').forEach(tooltip => {
                    tooltip.remove();
                });
            });
        });
    }

    // Settings modal
    showSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    // Support modal
    showSupportModal() {
        const modal = document.getElementById('support-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    // Gemini chat modal
    showGeminiChat() {
        const modal = document.getElementById('gemini-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    // Handle support form submission
    async handleSupportSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const supportData = {
            user_id: this.currentUser?.user_id || null,
            category: 'general',
            subject: formData.get('support-subject'),
            message: formData.get('support-message')
        };

        try {
            const response = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(supportData)
            });

            if (response.ok) {
                this.showToast('Обращение отправлено успешно!', 'success');
                event.target.reset();
                document.getElementById('support-modal').classList.remove('show');
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Ошибка отправки обращения', 'error');
            }
        } catch (error) {
            console.error('Error submitting support:', error);
            this.showToast('Ошибка отправки обращения', 'error');
        }
    }

    // Handle Gemini chat submission
    async handleGeminiSubmit(event) {
        event.preventDefault();
        
        const input = document.getElementById('gemini-input');
        const message = input.value.trim();
        
        if (!message) return;

        const messagesContainer = document.getElementById('gemini-messages');
        
        // Add user message
        this.addGeminiMessage(messagesContainer, message, 'user');
        input.value = '';

        // Add loading message
        const loadingDiv = this.addGeminiMessage(messagesContainer, 'Думаю...', 'assistant', true);

        try {
            const response = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    user_id: this.currentUser?.user_id
                })
            });

            const data = await response.json();
            
            // Remove loading message
            loadingDiv.remove();
            
            if (response.ok) {
                this.addGeminiMessage(messagesContainer, data.reply, 'assistant');
            } else {
                this.addGeminiMessage(messagesContainer, 'Извините, произошла ошибка. Попробуйте еще раз.', 'assistant');
            }
        } catch (error) {
            console.error('Gemini chat error:', error);
            loadingDiv.remove();
            this.addGeminiMessage(messagesContainer, 'Ошибка соединения. Проверьте интернет-подключение.', 'assistant');
        }
    }

    addGeminiMessage(container, message, role, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `gemini-message ${role} ${isLoading ? 'loading' : ''}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${isLoading ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : message}
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        
        return messageDiv;
    }

    // Utility functions
    getStatusText(status) {
        const statusTexts = {
            'pending': 'Ожидает',
            'in_progress': 'В работе',
            'completed': 'Завершен',
            'cancelled': 'Отменен',
            'refunded': 'Возвращен'
        };
        return statusTexts[status] || status;
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fa-solid fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Global functions for callbacks
window.handleGoogleLogin = async function(response) {
    if (window.app) {
        await window.app.handleGoogleLogin(response);
    }
};

window.showToast = function(message, type) {
    if (window.app) {
        window.app.showToast(message, type);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded, initializing app...');
    window.app = new RootzsuApp();
});

// Handle page visibility change to manage resources
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 Page hidden - pausing non-critical operations');
    } else {
        console.log('📱 Page visible - resuming operations');
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('🌐 Connection restored');
    if (window.app) {
        window.app.showToast('Соединение восстановлено', 'success');
    }
});

window.addEventListener('offline', () => {
    console.log('📡 Connection lost');
    if (window.app) {
        window.app.showToast('Нет соединения с интернетом', 'warning');
    }
});