// Main Application Script
class RootzsuApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.isAdmin = false;
        this.services = [];
        this.init();
    }

    async init() {
        try {
            await this.showIntroAnimation();
            await this.initializeApp();
            this.bindEvents();
            this.loadServices();
            this.updateNavigation();
            this.startClock();
            initLanguageSwitcher();
            updatePageLanguage();
        } catch (error) {
            console.error('App initialization error:', error);
            this.hidePreloader();
        }
    }

    async showIntroAnimation() {
        return new Promise(resolve => {
            const intro = document.getElementById('intro-animation');
            if (!intro) {
                resolve();
                return;
            }
            
            setTimeout(() => {
                intro.style.opacity = '0';
                setTimeout(() => {
                    intro.style.display = 'none';
                    resolve();
                }, 500);
            }, 3000);
        });
    }

    async initializeApp() {
        await this.loadUserFromStorage();
        this.hidePreloader();
        this.loadPage('home');
    }

    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => preloader.style.display = 'none', 500);
        }
    }

    initializeGoogleAuth() {
        // Initialize Google Sign-In
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: "957687109285-gs24ojtjhjkatpi7n0rrpb1c57tf95e2.apps.googleusercontent.com",
                callback: this.handleGoogleSignIn.bind(this)
            });
        }
    }

    async handleGoogleSignIn(response) {
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
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.updateUserInterface();
                this.showToast(t('login_success') || 'Вход выполнен успешно!', 'success');
                
                // Check if user is admin
                if (data.is_admin || this.currentUser.email === 'aishchnko12@gmail.com') {
                    document.getElementById('admin-nav-link').style.display = 'block';
                }
            } else {
                this.showToast(data.message || 'Ошибка входа', 'error');
            }
        } catch (error) {
            console.error('Google Sign-In error:', error);
            this.showToast('Ошибка при входе через Google', 'error');
        }
    }

    async checkUserSession() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUserInterface();
                
                // Check if user is admin
                if (this.currentUser.email === 'aishchnko12@gmail.com') {
                    document.getElementById('admin-nav-link').style.display = 'block';
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }

    updateUserInterface() {
        // Update cabinet page with user info
        if (this.currentUser) {
            const cabinetContent = document.querySelector('#cabinet .page-content');
            if (cabinetContent) {
                cabinetContent.innerHTML = `
                    <div class="user-profile">
                        <div class="user-avatar">
                            <img src="${this.currentUser.avatar_url || 'https://via.placeholder.com/100'}" alt="Avatar">
                        </div>
                        <div class="user-info">
                            <h2>${this.currentUser.first_name} ${this.currentUser.last_name || ''}</h2>
                            <p class="user-email">${this.currentUser.email}</p>
                            <div class="user-stats">
                                <div class="stat">
                                    <span class="stat-value">${this.currentUser.coins || 0}</span>
                                    <span class="stat-label">Монеты</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-value">0</span>
                                    <span class="stat-label">Заказы</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="btn primary" onclick="app.loadUserOrders()">
                            <i class="fa-solid fa-shopping-cart"></i>
                            Мои заказы
                        </button>
                        <button class="btn secondary" onclick="app.logout()">
                            <i class="fa-solid fa-sign-out-alt"></i>
                            Выйти
                        </button>
                    </div>
                `;
            }
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('admin-nav-link').style.display = 'none';
        this.loadPage('cabinet');
        this.showToast('Вы вышли из системы', 'info');
    }

    async loadUserOrders() {
        if (!this.currentUser) return;
        
        try {
            const response = await fetch(`/api/orders/user/${this.currentUser.user_id}`);
            if (response.ok) {
                const orders = await response.json();
                this.showUserOrders(orders);
            }
        } catch (error) {
            console.error('Error loading user orders:', error);
            this.showToast('Ошибка загрузки заказов', 'error');
        }
    }

    showUserOrders(orders) {
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        modal.innerHTML = `
            <div class="modal-content glass">
                <button class="modal-close-btn">&times;</button>
                <h2><i class="fa-solid fa-shopping-cart"></i> Мои заказы</h2>
                <div class="orders-list">
                    ${orders.length > 0 ? orders.map(order => `
                        <div class="order-item">
                            <div class="order-header">
                                <h3>Заказ #${order.order_id}</h3>
                                <span class="order-status status-${order.status}">${order.status}</span>
                            </div>
                            <p><strong>Услуга:</strong> ${order.service_name}</p>
                            <p><strong>Дата:</strong> ${new Date(order.creation_date).toLocaleDateString()}</p>
                            <p><strong>Сумма:</strong> $${order.price_paid}</p>
                        </div>
                    `).join('') : '<p>У вас пока нет заказов</p>'}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('show');
        
        modal.querySelector('.modal-close-btn').onclick = () => {
            modal.remove();
        };
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').substring(1);
                this.loadPage(page);
            });
        });

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }

        // Chat button
        const chatBtn = document.getElementById('chat-button');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => this.showGeminiModal());
        }

        // Modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close-btn')) {
                e.target.closest('.modal-container').remove();
            }
        });

        // Google Sign-In
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: "957687109285-gs24ojtjhjkatpi7n0rrpb1c57tf95e2.apps.googleusercontent.com",
                callback: this.handleGoogleSignIn.bind(this)
            });
        }
    }

    async loadServices() {
        try {
            const response = await fetch('/api/services');
            this.services = await response.json();
        } catch (error) {
            console.error('Error loading services:', error);
            this.services = [];
        }
    }

    updateNavigation() {
        const adminLink = document.getElementById('admin-nav-link');
        if (adminLink) {
            adminLink.style.display = this.isAdmin ? 'flex' : 'none';
        }
    }

    startClock() {
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

    async loadUserFromStorage() {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isAdmin = this.currentUser.is_admin || false;
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
            }
        }
    }

    async handleGoogleSignIn(response) {
        try {
            const result = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential })
            });

            const data = await result.json();

            if (result.ok) {
                this.currentUser = data.user;
                this.isAdmin = data.is_admin;
                localStorage.setItem('user', JSON.stringify(data.user));
                this.updateNavigation();
                this.showToast(data.message, 'success');
                this.loadPage('cabinet');
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Google Sign-In error:', error);
            this.showToast('Ошибка входа через Google', 'error');
        }
    }
                case 'admin':
                    if (this.currentUser && this.currentUser.email === 'aishchnko12@gmail.com') {
                        window.location.href = '/pages/admin.html';
                        return;
                    } else {
                        this.showToast('Доступ запрещен', 'error');
                        this.loadPage('home');
                        return;
                    }

    logout() {
        this.currentUser = null;
        this.isAdmin = false;
        localStorage.removeItem('user');
        this.updateNavigation();
        this.loadPage('home');
        this.showToast('Вы вышли из системы', 'info');
    }

    loadPage(page) {
        this.currentPage = page;
        
        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${page}`) {
                link.classList.add('active');
            }
        });

        // Load page content
        const app = document.getElementById('app');
        switch (page) {
            case 'home':
                app.innerHTML = this.getHomePageHTML();
                break;
            case 'services':
                app.innerHTML = this.getServicesPageHTML();
                this.bindServiceEvents();
                break;
            case 'service-details':
                app.innerHTML = this.getServiceDetailsPageHTML();
                break;
            case 'team':
                app.innerHTML = this.getTeamPageHTML();
                break;
            case 'cabinet':
                app.innerHTML = this.getCabinetPageHTML();
                this.bindCabinetEvents();
                break;
            case 'status':
                app.innerHTML = this.getStatusPageHTML();
                this.loadStatusData();
                break;
            case 'support':
                app.innerHTML = this.getSupportPageHTML();
                this.bindSupportEvents();
                break;
            case 'admin':
                if (this.isAdmin) {
                    app.innerHTML = this.getAdminPageHTML();
                    this.bindAdminEvents();
                    this.loadAdminData();
                } else {
                    app.innerHTML = '<div class="glass" style="text-align: center; padding: 40px;"><h2>Доступ запрещен</h2><p>У вас нет прав администратора</p></div>';
                }
                break;
            default:
                app.innerHTML = this.getHomePageHTML();
        }

        // Update language after loading page
        updatePageLanguage();
    }

    getHomePageHTML() {
        return `
            <div class="hero-section fade-in">
                <div class="hero-content">
                    <h1 class="hero-title" data-lang-key="welcome_title">Добро пожаловать в ROOTZSU</h1>
                    <p class="hero-subtitle" data-lang-key="welcome_subtitle">Профессиональные IT-услуги и техническая поддержка</p>
                    <p class="hero-description" data-lang-key="hero_description">Мы предоставляем высококачественные услуги по настройке устройств, установке ПО и технической поддержке. Наша команда экспертов готова решить любые технические задачи с мобильными устройствами и компьютерами.</p>
                    <div class="hero-buttons">
                        <button class="btn primary" onclick="app.loadPage('services')">
                            <i class="fa-solid fa-rocket"></i>
                            <span data-lang-key="get_started">Начать работу</span>
                        </button>
                        <button class="btn secondary" onclick="app.loadPage('service-details')">
                            <i class="fa-solid fa-info-circle"></i>
                            <span data-lang-key="learn_more">Узнать больше</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="about-section fade-in">
                <div class="about-content">
                    <h2 class="about-title" data-lang-key="about_title">О нашей компании</h2>
                    <p class="about-description" data-lang-key="about_description">ROOTZSU - это команда профессионалов с многолетним опытом в области мобильных технологий и системного администрирования. Мы специализируемся на разблокировке загрузчиков, установке кастомных прошивок, восстановлении устройств и решении сложных технических задач.</p>
                    <div class="about-stats">
                        <div class="about-stat">
                            <div class="about-stat-number">5+</div>
                            <div class="about-stat-label" data-lang-key="experience_years">Лет опыта</div>
                        </div>
                        <div class="about-stat">
                            <div class="about-stat-number">1000+</div>
                            <div class="about-stat-label" data-lang-key="satisfied_clients">Довольных клиентов</div>
                        </div>
                        <div class="about-stat">
                            <div class="about-stat-number">2500+</div>
                            <div class="about-stat-label" data-lang-key="services_completed">Выполненных услуг</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="features-section fade-in">
                <h2 data-lang-key="features_title">Наши преимущества</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fa-solid fa-award"></i></div>
                        <h3 class="feature-title" data-lang-key="feature_quality">Высокое качество</h3>
                        <p class="feature-description" data-lang-key="feature_quality_desc">Профессиональный подход к каждому заказу с гарантией качества</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fa-solid fa-bolt"></i></div>
                        <h3 class="feature-title" data-lang-key="feature_speed">Быстрое выполнение</h3>
                        <p class="feature-description" data-lang-key="feature_speed_desc">Оперативное решение ваших задач в кратчайшие сроки</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fa-solid fa-headset"></i></div>
                        <h3 class="feature-title" data-lang-key="feature_support">24/7 Поддержка</h3>
                        <p class="feature-description" data-lang-key="feature_support_desc">Круглосуточная техническая поддержка и консультации</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fa-solid fa-dollar-sign"></i></div>
                        <h3 class="feature-title" data-lang-key="feature_price">Доступные цены</h3>
                        <p class="feature-description" data-lang-key="feature_price_desc">Конкурентные цены на все виды услуг</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fa-solid fa-shield-alt"></i></div>
                        <h3 class="feature-title" data-lang-key="feature_security">Безопасность</h3>
                        <p class="feature-description" data-lang-key="feature_security_desc">Полная конфиденциальность и безопасность ваших данных</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fa-solid fa-certificate"></i></div>
                        <h3 class="feature-title" data-lang-key="feature_warranty">Гарантия</h3>
                        <p class="feature-description" data-lang-key="feature_warranty_desc">Гарантия на все выполненные работы</p>
                    </div>
                </div>
            </div>
        `;
    }

    getServicesPageHTML() {
        const basicServices = this.services.filter(s => s.category === 'basic');
        const advancedServices = this.services.filter(s => s.category === 'advanced');

        return `
            <div class="fade-in">
                <h2 data-lang-key="services_title">Наши услуги</h2>
                
                <div class="service-categories">
            
            <div class="programs-preview-section">
                <h2 class="section-title">Наши программы</h2>
                <p class="section-subtitle">Полезные инструменты и боты для повседневного использования</p>
                <div class="programs-preview-grid">
                    <div class="program-preview-card" onclick="window.open('/pages/programs.html', '_blank')">
                        <div class="program-icon">🖥️</div>
                        <h3>ПК программы</h3>
                        <p>Оптимизация, драйверы, системные утилиты</p>
                    </div>
                    <div class="program-preview-card" onclick="window.open('/pages/programs.html', '_blank')">
                        <div class="program-icon">🛠️</div>
                        <h3>Полезные инструменты</h3>
                        <p>Конвертеры, генераторы, утилиты</p>
                    </div>
                    <div class="program-preview-card" onclick="window.open('/pages/programs.html', '_blank')">
                        <div class="program-icon">🤖</div>
                        <h3>Telegram боты</h3>
                        <p>Автоматизация, файлы, сервисы</p>
                    </div>
                </div>
                <div class="programs-action">
                    <button class="btn primary" onclick="window.open('/pages/programs.html', '_blank')">
                        <i class="fa-solid fa-external-link-alt"></i>
                        Посмотреть все программы
                    </button>
                </div>
            </div>
                    <div class="category-buttons">
                        <button class="category-btn active" data-category="all">Все услуги</button>
                        <button class="category-btn" data-category="basic" data-lang-key="service_basic">Базовые</button>
                        <button class="category-btn" data-category="advanced" data-lang-key="service_advanced">Продвинутые</button>
        if (!this.currentUser) {
            return `
                <div class="cabinet-login">
                    <div class="login-card glass">
                        <h2><i class="fa-solid fa-user-astronaut"></i> <span data-lang-key="cabinet_title">Личный кабинет</span></h2>
                        <p data-lang-key="login_description">Войдите в свой аккаунт для доступа к личному кабинету</p>
                        <div class="login-options">
                            <div id="google-signin-button"></div>
                        </div>
                        <div class="login-benefits">
                            <h3>Преимущества регистрации:</h3>
                            <ul>
                                <li><i class="fa-solid fa-check"></i> Отслеживание заказов</li>
                                <li><i class="fa-solid fa-check"></i> История покупок</li>
                                <li><i class="fa-solid fa-check"></i> Персональные скидки</li>
                                <li><i class="fa-solid fa-check"></i> Приоритетная поддержка</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
        
                    </div>
            <div class="user-cabinet">
                <div class="cabinet-header">
                    <div class="user-profile">
                        <div class="user-avatar">
                            <img src="${this.currentUser.avatar_url || 'https://via.placeholder.com/100'}" alt="Avatar">
                        </div>
                        <div class="user-info">
                            <h2>${this.currentUser.first_name} ${this.currentUser.last_name || ''}</h2>
                            <p class="user-email">${this.currentUser.email}</p>
                            <div class="user-stats">
                                <div class="stat">
                                    <span class="stat-value">${this.currentUser.coins || 0}</span>
                                    <span class="stat-label">Монеты</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-value">0</span>
                                    <span class="stat-label">Заказы</span>
                                </div>
                            </div>
                        </div>

                    <div class="service-category" data-category="advanced">
                        <h3 data-lang-key="service_advanced">Продвинутые услуги</h3>
                        <div class="grid">
                            ${advancedServices.map(service => this.getServiceCardHTML(service)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getServiceCardHTML(service) {
        const difficultyColors = {
            beginner: '#34c759',
            intermediate: '#ff9500',
            advanced: '#ff3b30',
            expert: '#af52de'
        };

        return `
            <div class="glass service-item" data-category="${service.category}">
                <div class="service-header">
                    <div class="icon"><i class="fa-solid fa-mobile-screen-button"></i></div>
                    <div class="service-badges">
                        <span class="badge ${service.category}" style="background: ${service.category === 'basic' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)'}; color: ${service.category === 'basic' ? '#34c759' : '#ff3b30'};">${service.category}</span>
                        <span class="badge difficulty" style="background: rgba(${difficultyColors[service.difficulty_level]}, 0.2); color: ${difficultyColors[service.difficulty_level]};">${service.difficulty_level}</span>
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
                    <div class="price-row stars-price">
                        <i class="fa-solid fa-star"></i>
                        <span>${service.price_stars} Stars</span>
                    </div>
                </div>
                <div class="service-actions">
                    <button class="btn primary" onclick="app.orderService(${service.service_id})">
                        <i class="fa-solid fa-shopping-cart"></i>
                        <span data-lang-key="order_service">Заказать</span>
                    </button>
                </div>
            </div>
        `;
    }

    getServiceDetailsPageHTML() {
        return `
            <div class="service-details-container fade-in">
                <h2 data-lang-key="service_details_title">Подробное описание услуг</h2>
                
                <div class="service-detail-card">
                    <div class="service-detail-header">
                        <div class="service-detail-icon"><i class="fa-solid fa-unlock"></i></div>
                        <h3 class="service-detail-title" data-lang-key="bootloader_unlock_title">Разблокировка загрузчика</h3>
                    </div>
                    <p class="service-detail-description" data-lang-key="bootloader_unlock_desc">Разблокировка загрузчика (Bootloader Unlock) - это процедура, которая позволяет получить полный контроль над вашим Android-устройством. После разблокировки вы сможете устанавливать кастомные прошивки, получать root-права и модифицировать системные файлы.</p>
                    <div class="service-detail-features">
                        <div class="service-feature">
                            <i class="fa-solid fa-check"></i>
                            <span>Поддержка всех популярных брендов</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-shield-alt"></i>
                            <span>Безопасная процедура</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-clock"></i>
                            <span>Быстрое выполнение</span>
                        </div>
                    </div>
                </div>

                <div class="service-detail-card">
                    <div class="service-detail-header">
                        <div class="service-detail-icon"><i class="fa-solid fa-user-shield"></i></div>
                        <h3 class="service-detail-title" data-lang-key="root_installation_title">Установка root-прав</h3>
                    </div>
                    <p class="service-detail-description" data-lang-key="root_installation_desc">Root-права дают вам административный доступ к операционной системе Android. С root-правами вы можете удалять системные приложения, устанавливать специальные программы, изменять системные настройки и получить полный контроль над устройством.</p>
                    <div class="service-detail-features">
                        <div class="service-feature">
                            <i class="fa-solid fa-mobile-alt"></i>
                            <span>Поддержка Android 4.0+</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-tools"></i>
                            <span>Установка Magisk/SuperSU</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-undo"></i>
                            <span>Возможность отката</span>
                        </div>
                    </div>
                </div>

                <div class="service-detail-card">
                    <div class="service-detail-header">
                        <div class="service-detail-icon"><i class="fa-solid fa-microchip"></i></div>
                        <h3 class="service-detail-title" data-lang-key="custom_rom_title">Прошивка устройств</h3>
                    </div>
                    <p class="service-detail-description" data-lang-key="custom_rom_desc">Установка кастомных прошивок позволяет полностью изменить операционную систему вашего устройства. Мы устанавливаем популярные прошивки как LineageOS, Pixel Experience, MIUI и другие, что дает новые функции и улучшенную производительность.</p>
                    <div class="service-detail-features">
                        <div class="service-feature">
                            <i class="fa-solid fa-rocket"></i>
                            <span>Улучшенная производительность</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-palette"></i>
                            <span>Новые функции и интерфейс</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-battery-full"></i>
                            <span>Оптимизация батареи</span>
                        </div>
                    </div>
                </div>

                <div class="service-detail-card">
                    <div class="service-detail-header">
                        <div class="service-detail-icon"><i class="fa-solid fa-desktop"></i></div>
                        <h3 class="service-detail-title" data-lang-key="os_installation_title">Установка ОС (ПК)</h3>
                    </div>
                    <p class="service-detail-description" data-lang-key="os_installation_desc">Профессиональная установка операционных систем Windows (7, 10, 11) и Linux (Ubuntu, Debian, Arch). Включает настройку драйверов, установку необходимого ПО и оптимизацию системы для максимальной производительности.</p>
                    <div class="service-detail-features">
                        <div class="service-feature">
                            <i class="fa-brands fa-windows"></i>
                            <span>Windows 7/10/11</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-brands fa-linux"></i>
                            <span>Linux дистрибутивы</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-cogs"></i>
                            <span>Настройка драйверов</span>
                        </div>
                    </div>
                </div>

                <div class="service-detail-card">
                    <div class="service-detail-header">
                        <div class="service-detail-icon"><i class="fa-solid fa-life-ring"></i></div>
                        <h3 class="service-detail-title" data-lang-key="recovery_installation_title">Установка рекавери</h3>
                    </div>
                    <p class="service-detail-description" data-lang-key="recovery_installation_desc">Установка кастомного рекавери (TWRP, CWM) для расширенного управления устройством. Рекавери позволяет создавать резервные копии, устанавливать прошивки, очищать разделы и выполнять другие системные операции.</p>
                    <div class="service-detail-features">
                        <div class="service-feature">
                            <i class="fa-solid fa-save"></i>
                            <span>Создание бэкапов</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-download"></i>
                            <span>Установка прошивок</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-broom"></i>
                            <span>Очистка разделов</span>
                        </div>
                    </div>
                </div>

                <div class="service-detail-card">
                    <div class="service-detail-header">
                        <div class="service-detail-icon"><i class="fa-solid fa-virus-slash"></i></div>
                        <h3 class="service-detail-title" data-lang-key="virus_removal_title">Удаление вирусов</h3>
                    </div>
                    <p class="service-detail-description" data-lang-key="virus_removal_desc">Комплексная очистка устройств от вирусов, троянов, рекламного ПО и других вредоносных программ. Включает глубокое сканирование, удаление угроз и установку защитного ПО для предотвращения повторного заражения.</p>
                    <div class="service-detail-features">
                        <div class="service-feature">
                            <i class="fa-solid fa-search"></i>
                            <span>Глубокое сканирование</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-trash"></i>
                            <span>Удаление угроз</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-shield"></i>
                            <span>Установка защиты</span>
                        </div>
                    </div>
                </div>

                <div class="service-detail-card">
                    <div class="service-detail-header">
                        <div class="service-detail-icon"><i class="fa-solid fa-wrench"></i></div>
                        <h3 class="service-detail-title" data-lang-key="edl_recovery_title">Восстановление через EDL</h3>
                    </div>
                    <p class="service-detail-description" data-lang-key="edl_recovery_desc">Emergency Download Mode (EDL) - это специальный режим для восстановления устройств Qualcomm, которые не загружаются или имеют серьезные программные повреждения. Позволяет восстановить даже 'мертвые' устройства на уровне загрузчика.</p>
                    <div class="service-detail-features">
                        <div class="service-feature">
                            <i class="fa-solid fa-microchip"></i>
                            <span>Устройства Qualcomm</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-heart-pulse"></i>
                            <span>Восстановление "мертвых" устройств</span>
                        </div>
                        <div class="service-feature">
                            <i class="fa-solid fa-tools"></i>
                            <span>Низкоуровневое восстановление</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getTeamPageHTML() {
        return `
            <div class="fade-in">
                <h2>Наша команда</h2>
                <div class="grid">
                    <div class="glass team-card">
                        <div class="team-avatar">
                            <i class="fa-solid fa-user-tie" style="font-size: 4rem; color: var(--accent);"></i>
                        </div>
                        <h3>Главный разработчик</h3>
                        <p>Специалист по мобильным технологиям и системному администрированию</p>
                </div>
                <div class="cabinet-content">
                    <div class="cabinet-actions">
                        <button class="btn primary" onclick="app.loadUserOrders()">
                            <i class="fa-solid fa-shopping-cart"></i>
                            Мои заказы
                        </button>
                        <button class="btn secondary" onclick="app.loadPage('services')">
                            <i class="fa-solid fa-plus"></i>
                            Новый заказ
                        </button>
                        <button class="btn secondary" onclick="app.logout()">
                            <i class="fa-solid fa-sign-out-alt"></i>
                            Выйти
                        </button>
                        <div class="team-avatar">
                            <i class="fa-solid fa-user-gear" style="font-size: 4rem; color: var(--accent);"></i>
                        </div>
                        <h3>Технический специалист</h3>
                        <p>Эксперт по восстановлению устройств и решению сложных технических задач</p>
                        <div class="team-skills">
                    </div>
                </div>
            </div>
        `;
    }

    getCabinetPageHTML() {
        if (!this.currentUser) {
            return `
                <div class="glass" style="text-align: center; padding: 40px;">
                    <h2 data-lang-key="login_required">Необходимо войти в систему</h2>
                    <p data-lang-key="login_description">Войдите в свой аккаунт для доступа к личному кабинету</p>
                    <div id="google-signin-container">
                        <div id="g_id_onload"
                             data-client_id="957687109285-gs24ojtjhjkatpi7n0rrpb1c57tf95e2.apps.googleusercontent.com"
                             data-callback="handleGoogleSignIn">
                        </div>
                        <div class="g_id_signin" data-type="standard"></div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="cabinet-grid fade-in">
                <div class="profile-sidebar glass">
                    <img src="${this.currentUser.avatar_url || '/default-avatar.png'}" alt="Avatar" class="avatar">
                    <h2 class="name">${this.currentUser.first_name} ${this.currentUser.last_name || ''}</h2>
                    <p class="email">${this.currentUser.email}</p>
                    <div class="cabinet-actions">
                        <button class="btn secondary" onclick="app.logout()">
                            <i class="fa-solid fa-sign-out-alt"></i>
                            Выйти
                        </button>
                    </div>
                </div>
                <div class="profile-content glass">
                    <div class="profile-tabs">
                        <button class="tab-btn active" data-tab="orders" data-lang-key="my_orders">Мои заказы</button>
                        <button class="tab-btn" data-tab="history" data-lang-key="order_history">История заказов</button>
                    </div>
                    <div class="tab-content">
                        <div class="tab-pane active" id="orders-tab">
                            <div id="user-orders">Загрузка заказов...</div>
                        </div>
                        <div class="tab-pane" id="history-tab">
                            <div id="order-history">История заказов будет здесь</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusPageHTML() {
        return `
            <div class="fade-in">
                <h2>Статус системы</h2>
                <div class="status-grid">
                    <div class="glass status-card">
                        <div class="icon"><i class="fa-solid fa-microchip"></i></div>
                        <div class="label">Загрузка CPU</div>
                        <div class="value" id="cpu-usage">--%</div>
                    </div>
                    <div class="glass status-card">
                        <div class="icon"><i class="fa-solid fa-memory"></i></div>
                        <div class="label">Использование RAM</div>
                        <div class="value" id="ram-usage">--%</div>
                    </div>
                    <div class="glass status-card">
                        <div class="icon"><i class="fa-solid fa-users"></i></div>
                        <div class="label">Пользователи</div>
                        <div class="value" id="user-count">--</div>
                    </div>
                    <div class="glass status-card">
                        <div class="icon"><i class="fa-solid fa-shopping-cart"></i></div>
                        <div class="label">Активные заказы</div>
                        <div class="value" id="active-orders">--</div>
                    </div>
                </div>
            </div>
        `;
    }

    getSupportPageHTML() {
        return `
            <div class="fade-in">
                <div class="support-form glass">
                    <h2><i class="fa-solid fa-headset"></i> <span data-lang-key="support_title">Техническая поддержка</span></h2>
                    <p data-lang-key="support_description">Опишите вашу проблему, и мы поможем её решить</p>
                    <form id="support-form">
                        <div class="form-group">
                            <label data-lang-key="support_subject">Тема обращения</label>
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

    getAdminPageHTML() {
        return `
            <div class="admin-container fade-in">
                <div class="admin-header">
                    <h2 class="admin-title" data-lang-key="admin_panel">Админ панель</h2>
                </div>
                
                <div class="admin-tabs">
                    <button class="admin-tab active" data-tab="users" data-lang-key="admin_users">Пользователи</button>
                    <button class="admin-tab" data-tab="orders" data-lang-key="admin_orders">Заказы</button>
                    <button class="admin-tab" data-tab="payments" data-lang-key="admin_payments">Платежи</button>
                </div>
                
                <div class="admin-content">
                    <div class="admin-tab-content active" id="admin-users">
                        <h3>Пользователи системы</h3>
                        <div id="admin-users-list">Загрузка...</div>
                    </div>
                    
                    <div class="admin-tab-content" id="admin-orders">
                        <h3>Все заказы</h3>
                        <div id="admin-orders-list">Загрузка...</div>
                    </div>
                    
                    <div class="admin-tab-content" id="admin-payments">
                        <h3>Платежи на рассмотрении</h3>
                        <div id="admin-payments-list">Загрузка...</div>
                    </div>
                </div>
            </div>
        `;
    }

    bindServiceEvents() {
        // Category filter buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const category = btn.dataset.category;
                this.filterServices(category);
            });
        });
    }

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

    bindCabinetEvents() {
        if (!this.currentUser) return;

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
            });
        });

        // Load user orders
        this.loadUserOrders();
    }

    async loadUserOrders() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/orders/user/${this.currentUser.user_id}`);
            const orders = await response.json();
            
            const ordersContainer = document.getElementById('user-orders');
            if (orders.length === 0) {
                ordersContainer.innerHTML = '<p>У вас пока нет заказов</p>';
                return;
            }

            ordersContainer.innerHTML = orders.map(order => `
                <div class="order-item">
                    <div class="order-header">
                        <h4>Заказ #${order.order_id}</h4>
                        <span class="status-badge ${order.status}">${order.status}</span>
                    </div>
                    <p><strong>Услуга:</strong> ${order.service_name}</p>
                    <p><strong>Дата:</strong> ${new Date(order.creation_date).toLocaleDateString()}</p>
                    <p><strong>Способ оплаты:</strong> ${order.payment_method}</p>
                    ${order.admin_notes ? `<p><strong>Комментарий:</strong> ${order.admin_notes}</p>` : ''}
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading user orders:', error);
            document.getElementById('user-orders').innerHTML = '<p>Ошибка загрузки заказов</p>';
        }
    }

    bindSupportEvents() {
        const form = document.getElementById('support-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (!this.currentUser) {
                    this.showToast('Необходимо войти в систему', 'error');
                    return;
                }

                const subject = document.getElementById('support-subject').value;
                const message = document.getElementById('support-message').value;

                try {
                    const response = await fetch('/api/support/tickets', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: this.currentUser.user_id,
                            category: 'general',
                            subject: subject,
                            message: message
                        })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        this.showToast('Обращение отправлено успешно!', 'success');
                        form.reset();
                    } else {
                        this.showToast(result.error || 'Ошибка отправки', 'error');
                    }
                } catch (error) {
                    console.error('Support form error:', error);
                    this.showToast('Ошибка отправки обращения', 'error');
                }
            });
        }
    }

    bindAdminEvents() {
        // Admin tab switching
        document.querySelectorAll('.admin-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`admin-${btn.dataset.tab}`).classList.add('active');
                
                // Load data for the selected tab
                this.loadAdminTabData(btn.dataset.tab);
            });
        });
    }

    async loadAdminData() {
        this.loadAdminTabData('users');
    }

    async loadAdminTabData(tab) {
        switch (tab) {
            case 'users':
                await this.loadAdminUsers();
                break;
            case 'orders':
                await this.loadAdminOrders();
                break;
            case 'payments':
                await this.loadAdminPayments();
                break;
        }
    }

    async loadAdminUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const users = await response.json();
            
            const container = document.getElementById('admin-users-list');
            container.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Email</th>
                            <th>Дата регистрации</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.user_id}</td>
                                <td>${user.first_name} ${user.last_name || ''}</td>
                                <td>${user.email || 'N/A'}</td>
                                <td>${new Date(user.creation_date).toLocaleDateString()}</td>
                                <td>${user.is_banned ? 'Заблокирован' : 'Активен'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Error loading admin users:', error);
        }
    }

    async loadAdminOrders() {
        try {
            const response = await fetch('/api/admin/orders');
            const orders = await response.json();
            
            const container = document.getElementById('admin-orders-list');
            container.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Пользователь</th>
                            <th>Услуга</th>
                            <th>Способ оплаты</th>
                            <th>Статус</th>
                            <th>Дата</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>${order.order_id}</td>
                                <td>${order.first_name} ${order.last_name || ''}</td>
                                <td>${order.service_name}</td>
                                <td>${order.payment_method}</td>
                                <td>${order.status}</td>
                                <td>${new Date(order.creation_date).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Error loading admin orders:', error);
        }
    }

    async loadAdminPayments() {
        try {
            const response = await fetch('/api/admin/orders?status=pending');
            const payments = await response.json();
            
            const container = document.getElementById('admin-payments-list');
            container.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID заказа</th>
                            <th>Пользователь</th>
                            <th>Услуга</th>
                            <th>Способ оплаты</th>
                            <th>Скриншот</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.map(payment => `
                            <tr>
                                <td>${payment.order_id}</td>
                                <td>${payment.first_name} ${payment.last_name || ''}</td>
                                <td>${payment.service_name}</td>
                                <td>${payment.payment_method}</td>
                                <td>
                                    ${payment.payment_screenshot ? 
                                        `<a href="/${payment.payment_screenshot}" target="_blank">Просмотр</a>` : 
                                        'Нет скриншота'
                                    }
                                </td>
            case 'cabinet':
                if (!this.currentUser) {
                    // Initialize Google Sign-In button
                    setTimeout(() => {
                        if (typeof google !== 'undefined' && google.accounts) {
                            google.accounts.id.renderButton(
                                document.getElementById('google-signin-button'),
                                {
                                    theme: 'outline',
                                    size: 'large',
                                    text: 'signin_with',
                                    width: 250
                                }
                            );
                        }
                    }, 100);
                }
                break;
                                <td class="admin-actions">
                                    <button class="admin-btn approve" onclick="app.approvePayment(${payment.order_id})" data-lang-key="admin_approve">Одобрить</button>
                                    <button class="admin-btn reject" onclick="app.rejectPayment(${payment.order_id})" data-lang-key="admin_reject">Отклонить</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Error loading admin payments:', error);
        }
    }

    async approvePayment(orderId) {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/approve`, {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast('Платеж одобрен', 'success');
                this.loadAdminPayments(); // Refresh the list
            } else {
                this.showToast(result.error || 'Ошибка одобрения', 'error');
            }
        } catch (error) {
            console.error('Error approving payment:', error);
            this.showToast('Ошибка одобрения платежа', 'error');
        }
    }

    async rejectPayment(orderId) {
        const reason = prompt('Укажите причину отклонения:');
        if (!reason) return;

        try {
            const response = await fetch(`/api/admin/orders/${orderId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast('Платеж отклонен', 'success');
                this.loadAdminPayments(); // Refresh the list
        if (!this.currentUser) {
            this.showToast('Войдите в систему для отправки обращения', 'warning');
            return;
        }
        
            } else {
                this.showToast(result.error || 'Ошибка отклонения', 'error');
            }
        } catch (error) {
            console.error('Error rejecting payment:', error);
            this.showToast('Ошибка отклонения платежа', 'error');
        }
                    user_id: this.currentUser.user_id,
                    category: 'general',
    }

    async loadStatusData() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            document.getElementById('cpu-usage').textContent = `${data.cpu_usage}%`;
            document.getElementById('ram-usage').textContent = `${data.ram_usage}%`;
            document.getElementById('user-count').textContent = data.user_count;
            document.getElementById('active-orders').textContent = data.active_orders;
        } catch (error) {
            console.error('Error loading status data:', error);
        }
    }

    async orderService(serviceId) {
        if (!this.currentUser) {
            this.showToast('Войдите в систему для заказа услуг', 'warning');
            this.loadPage('cabinet');
            return;
        }
        
        if (!this.currentUser) {
            this.showToast('Необходимо войти в систему', 'error');
            this.loadPage('cabinet');
            return;
        }

        const service = this.services.find(s => s.service_id === serviceId);
        if (!service) {
            this.showToast('Услуга не найдена', 'error');
            return;
        }

        const orderData = {
            userId: this.currentUser.user_id,
            serviceId: serviceId,
            serviceName: service.name,
            serviceDescription: service.description,
            priceUsd: service.price_usd,
            priceEur: service.price_eur,
            priceUah: service.price_uah,
                    user_id: this.currentUser?.user_id
            priceStars: service.price_stars
        };

        if (window.paymentSystem) {
            window.paymentSystem.processPayment(orderData);
        } else {
            this.showToast('Система оплаты недоступна', 'error');
        }
    }

    showSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        modal.innerHTML = `
            <div class="modal-content glass">
                <button class="modal-close-btn">&times;</button>
                <h2><i class="fa-solid fa-cog"></i> <span data-lang-key="settings_title">Настройки</span></h2>

                <div class="setting-group">
                    <label data-lang-key="settings_language">Язык интерфейса</label>
                    <div class="theme-options">
                        <button class="theme-box ${currentLanguage === 'ru' ? 'active' : ''}" data-lang="ru">Русский</button>
                        <button class="theme-box ${currentLanguage === 'en' ? 'active' : ''}" data-lang="en">English</button>
                        <button class="theme-box ${currentLanguage === 'uk' ? 'active' : ''}" data-lang="uk">Українська</button>
                        <button class="theme-box ${currentLanguage === 'kz' ? 'active' : ''}" data-lang="kz">Қазақша</button>
                    </div>
                </div>

                <div class="setting-group">
                    <label data-lang-key="settings_theme">Тема</label>
                    <div class="theme-options">
                        <button class="theme-box" data-theme="dark">Dark</button>
                        <button class="theme-box" data-theme="light">Light</button>
                        <button class="theme-box" data-theme="cyberpunk">Cyberpunk</button>
                        <button class="theme-box" data-theme="matrix">Matrix</button>
                        <button class="theme-box" data-theme="aqua">Aqua</button>
                        <button class="theme-box" data-theme="hyprland">Hyprland</button>
                    </div>
                </div>

                <button id="save-settings" class="btn primary" style="width: 100%; margin-top: 20px;">
                    <i class="fa-solid fa-save"></i> 
                    <span data-lang-key="settings_save">Сохранить</span>
                </button>
            </div>
        `;

        // Bind events
        modal.querySelector('.modal-close-btn').onclick = () => modal.remove();
        
        modal.querySelectorAll('[data-lang]').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('[data-lang]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                setLanguage(btn.dataset.lang);
            });
        });

        modal.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.documentElement.setAttribute('data-theme', btn.dataset.theme);
                if (window.particleSystem) {
                    window.particleSystem.updateTheme(btn.dataset.theme);
                }
            });
        });

        modal.querySelector('#save-settings').onclick = () => {
            this.showToast('Настройки сохранены', 'success');
            modal.remove();
        };

        document.body.appendChild(modal);
        modal.classList.add('show');
        updatePageLanguage();
    }

    showGeminiModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        modal.innerHTML = `
            <div class="modal-content glass" style="max-width: 900px; height: 80vh;">
                <button class="modal-close-btn">&times;</button>
                <h2><i class="fa-solid fa-brain"></i> AI Ассистент</h2>
                <div id="gemini-chat-container">
                    <div class="gemini-messages" id="gemini-messages"></div>
                    <form class="gemini-input-form" id="gemini-form">
                        <input type="text" id="gemini-input" placeholder="Задайте вопрос..." required>
                        <button type="submit" class="btn primary">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;

        modal.querySelector('.modal-close-btn').onclick = () => modal.remove();
        
        const form = modal.querySelector('#gemini-form');
        const input = modal.querySelector('#gemini-input');
        const messages = modal.querySelector('#gemini-messages');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = input.value.trim();
            if (!message) return;

            // Add user message
            this.addChatMessage(messages, message, 'user');
            input.value = '';

            // Add typing indicator
            const typingMsg = this.addChatMessage(messages, 'Печатает...', 'bot typing');

            try {
                const response = await fetch('/api/gemini/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: message,
                        user_id: this.currentUser?.user_id 
                    })
                });

                const data = await response.json();
                
                // Remove typing indicator
                typingMsg.remove();

                if (response.ok) {
                    this.addChatMessage(messages, data.reply, 'bot');
                } else {
                    this.addChatMessage(messages, 'Извините, произошла ошибка.', 'bot');
                }
            } catch (error) {
                typingMsg.remove();
                this.addChatMessage(messages, 'Ошибка соединения с AI.', 'bot');
            }
        });

                priceStars: service.price_stars || 0,
                priceCoins: service.price_coins || 0
                userId: this.currentUser.user_id,
        modal.classList.add('show');
        input.focus();
    }

    addChatMessage(container, text, type) {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        container.appendChild(message);
        container.scrollTop = container.scrollHeight;
        return message;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Global functions for Google Sign-In
function handleGoogleSignIn(response) {
    if (window.app) {
        window.app.handleGoogleSignIn(response);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RootzsuApp();
});