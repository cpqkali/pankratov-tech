// Phantom Services - Client-Side Router
class PhantomRouter {
    constructor() {
        this.routes = {
            '/': 'home',
            '/services': 'services',
            '/programs': 'programs',
            '/news': 'news',
            '/cabinet': 'cabinet',
            '/admin': 'admin'
        };
        this.currentRoute = '/';
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.handleRoute();
    }
    
    bindEvents() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                this.navigate(href);
            }
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
    }
    
    navigate(path) {
        if (path === this.currentRoute) return;
        
        this.currentRoute = path;
        history.pushState(null, '', path);
        this.handleRoute();
    }
    
    handleRoute() {
        const path = window.location.pathname;
        const page = this.routes[path] || 'home';
        
        this.updateNavigation(path);
        this.loadPage(page);
    }
    
    updateNavigation(path) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === path) {
                link.classList.add('active');
            }
        });
    }
    
    async loadPage(page) {
        const mainContent = document.getElementById('main-content');
        
        try {
            loadingManager.show('page-load');
            
            switch (page) {
                case 'home':
                    mainContent.innerHTML = this.renderHomePage();
                    await this.loadHomeData();
                    break;
                case 'services':
                    mainContent.innerHTML = this.renderServicesPage();
                    await this.loadServicesData();
                    break;
                case 'programs':
                    mainContent.innerHTML = this.renderProgramsPage();
                    await this.loadProgramsData();
                    break;
                case 'news':
                    mainContent.innerHTML = this.renderNewsPage();
                    await this.loadNewsData();
                    break;
                case 'cabinet':
                    mainContent.innerHTML = this.renderCabinetPage();
                    await this.loadCabinetData();
                    break;
                case 'admin':
                    if (await this.checkAdminAccess()) {
                        mainContent.innerHTML = this.renderAdminPage();
                        await this.loadAdminData();
                    } else {
                        this.navigate('/');
                        showNotification('Доступ запрещен', 'error');
                    }
                    break;
                default:
                    mainContent.innerHTML = this.render404Page();
            }
            
        } catch (error) {
            console.error('Page load error:', error);
            mainContent.innerHTML = this.renderErrorPage();
        } finally {
            loadingManager.hide('page-load');
        }
    }
    
    renderHomePage() {
        return `
            <div class="page home-page">
                <section class="hero-section">
                    <div class="hero-background">
                        <div class="hero-gradient"></div>
                    </div>
                    
                    <div class="container">
                        <div class="hero-content">
                            <div class="hero-text">
                                <h1 class="hero-title">
                                    Добро пожаловать в <span class="gradient-text">Phantom Services</span>
                                </h1>
                                <p class="hero-subtitle">
                                    Профессиональные IT-услуги и инновационные решения для вашего бизнеса
                                </p>
                                <div class="hero-buttons">
                                    <button class="btn btn-primary" onclick="router.navigate('/services')">
                                        <i class="fas fa-rocket"></i>
                                        Наши услуги
                                    </button>
                                    <button class="btn btn-secondary" onclick="router.navigate('/programs')">
                                        <i class="fas fa-code"></i>
                                        Программы
                                    </button>
                                </div>
                            </div>
                            
                            <div class="hero-stats">
                                <div class="stat-item">
                                    <div class="stat-number" data-count="500">0</div>
                                    <div class="stat-label">Клиентов</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number" data-count="1200">0</div>
                                    <div class="stat-label">Проектов</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number" data-count="50">0</div>
                                    <div class="stat-label">Программ</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section class="features-section">
                    <div class="container">
                        <div class="section-header">
                            <h2 class="section-title">Почему выбирают нас</h2>
                            <p class="section-subtitle">
                                Мы предоставляем высококачественные услуги с гарантией результата
                            </p>
                        </div>
                        
                        <div class="services-grid" id="features-grid">
                            <div class="card">
                                <div class="card-icon">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <h3 class="card-title">Безопасность</h3>
                                <p class="card-description">
                                    Полная конфиденциальность и безопасность ваших данных
                                </p>
                            </div>
                            <div class="card">
                                <div class="card-icon">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <h3 class="card-title">Быстрое выполнение</h3>
                                <p class="card-description">
                                    Оперативное решение ваших задач в кратчайшие сроки
                                </p>
                            </div>
                            <div class="card">
                                <div class="card-icon">
                                    <i class="fas fa-headset"></i>
                                </div>
                                <h3 class="card-title">24/7 Поддержка</h3>
                                <p class="card-description">
                                    Круглосуточная техническая поддержка и консультации
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }
    
    renderServicesPage() {
        return `
            <div class="page services-page">
                <div class="container">
                    <div class="section-header">
                        <h1 class="section-title">Наши услуги</h1>
                        <p class="section-subtitle">
                            Предоставляем широкий спектр IT-услуг высочайшего качества
                        </p>
                    </div>
                    
                    <div class="services-grid" id="services-grid">
                        <div class="loading">Загрузка услуг...</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderProgramsPage() {
        return `
            <div class="page programs-page">
                <div class="container">
                    <div class="section-header">
                        <h1 class="section-title">Наши программы</h1>
                        <p class="section-subtitle">
                            Инновационные программные решения от нашей команды
                        </p>
                    </div>
                    
                    <div class="programs-grid" id="programs-grid">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-code"></i>
                            </div>
                            <h3 class="empty-state-title">Программы скоро появятся</h3>
                            <p class="empty-state-description">
                                Мы работаем над созданием полезных программ для вас. 
                                Следите за обновлениями!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderNewsPage() {
        return `
            <div class="page news-page">
                <div class="container">
                    <div class="section-header">
                        <h1 class="section-title">Новости</h1>
                        <p class="section-subtitle">
                            Последние новости и обновления от Phantom Services
                        </p>
                    </div>
                    
                    <div class="news-grid" id="news-grid">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-newspaper"></i>
                            </div>
                            <h3 class="empty-state-title">Новости скоро появятся</h3>
                            <p class="empty-state-description">
                                Мы готовим интересные новости и обновления для вас. 
                                Возвращайтесь позже!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderCabinetPage() {
        return `
            <div class="page cabinet-page">
                <div class="container">
                    <div id="cabinet-content">
                        <!-- Cabinet content will be loaded by auth manager -->
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAdminPage() {
        return `
            <div class="page admin-page">
                <div class="container">
                    <div class="section-header">
                        <h1 class="section-title">
                            <i class="fas fa-crown"></i>
                            Админ панель
                        </h1>
                        <p class="section-subtitle">
                            Управление контентом и пользователями Phantom Services
                        </p>
                    </div>
                    
                    <div class="admin-dashboard" id="admin-dashboard">
                        <div class="loading">Загрузка админ панели...</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    render404Page() {
        return `
            <div class="page error-page">
                <div class="container">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-ghost"></i>
                        </div>
                        <h1 class="empty-state-title">404 - Страница не найдена</h1>
                        <p class="empty-state-description">
                            Похоже, эта страница исчезла как призрак. 
                            Попробуйте вернуться на главную страницу.
                        </p>
                        <button class="btn btn-primary" onclick="router.navigate('/')">
                            <i class="fas fa-home"></i>
                            На главную
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderErrorPage() {
        return `
            <div class="page error-page">
                <div class="container">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h1 class="empty-state-title">Ошибка загрузки</h1>
                        <p class="empty-state-description">
                            Произошла ошибка при загрузке страницы. 
                            Попробуйте обновить страницу.
                        </p>
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            <i class="fas fa-refresh"></i>
                            Обновить
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    async loadHomeData() {
        // Initialize counter animations
        this.initCounterAnimations();
    }
    
    async loadServicesData() {
        try {
            const services = await api.getServices();
            this.renderServices(services);
        } catch (error) {
            console.error('Failed to load services:', error);
            document.getElementById('services-grid').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3 class="empty-state-title">Ошибка загрузки услуг</h3>
                    <p class="empty-state-description">
                        Не удалось загрузить список услуг. Попробуйте позже.
                    </p>
                </div>
            `;
        }
    }
    
    async loadProgramsData() {
        try {
            const programs = await api.getPrograms();
            if (programs.length > 0) {
                this.renderPrograms(programs);
            }
        } catch (error) {
            console.error('Failed to load programs:', error);
        }
    }
    
    async loadNewsData() {
        try {
            const news = await api.getNews();
            if (news.length > 0) {
                this.renderNews(news);
            }
        } catch (error) {
            console.error('Failed to load news:', error);
        }
    }
    
    async loadCabinetData() {
        // Cabinet data is handled by auth manager
        if (authManager) {
            authManager.updateCabinetSection();
        }
    }
    
    async loadAdminData() {
        // Admin data will be loaded by admin manager
        if (window.adminManager) {
            await adminManager.init();
        }
    }
    
    async checkAdminAccess() {
        if (!authManager.isLoggedIn()) {
            showNotification('Необходимо войти в систему', 'warning');
            openModal('login-modal');
            return false;
        }
        
        const user = authManager.getCurrentUser();
        const adminEmails = ['admin_phantom2000@phantom.com', 'aishchnko12@gmail.com'];
        
        return user && (user.is_admin || adminEmails.includes(user.email));
    }
    
    renderServices(services) {
        const grid = document.getElementById('services-grid');
        
        if (services.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-tools"></i>
                    </div>
                    <h3 class="empty-state-title">Услуги скоро появятся</h3>
                    <p class="empty-state-description">
                        Мы работаем над расширением списка услуг. Следите за обновлениями!
                    </p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = services.map(service => `
            <div class="card service-card">
                <div class="card-icon">
                    <i class="${service.icon || 'fas fa-cog'}"></i>
                </div>
                <h3 class="card-title">${service.name}</h3>
                <p class="card-description">${service.description}</p>
                <div class="card-meta">
                    <span class="card-price">${service.price} UAH</span>
                    <span class="service-duration">${service.duration || '1-2 дня'}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary order-service-btn" data-service-id="${service.service_id}">
                        <i class="fas fa-shopping-cart"></i>
                        Заказать
                    </button>
                </div>
            </div>
        `).join('');
        
        // Bind order buttons
        document.querySelectorAll('.order-service-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const serviceId = btn.dataset.serviceId;
                this.openOrderModal(serviceId);
            });
        });
    }
    
    renderPrograms(programs) {
        const grid = document.getElementById('programs-grid');
        
        grid.innerHTML = programs.map(program => `
            <div class="card program-card">
                <div class="card-icon">
                    ${program.icon || '<i class="fas fa-code"></i>'}
                </div>
                <h3 class="card-title">${program.name}</h3>
                <p class="card-description">${program.description}</p>
                <div class="card-meta">
                    <span class="program-language">${program.language || 'Python'}</span>
                    <span class="program-version">v${program.version || '1.0'}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary download-program-btn" data-program-id="${program.program_id}">
                        <i class="fas fa-download"></i>
                        Скачать
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderNews(news) {
        const grid = document.getElementById('news-grid');
        
        grid.innerHTML = news.map(newsItem => `
            <div class="card news-card">
                <div class="news-date">
                    ${new Date(newsItem.created_at).toLocaleDateString()}
                </div>
                <h3 class="card-title">${newsItem.title}</h3>
                <p class="card-description">${this.truncateText(newsItem.content, 150)}</p>
                <div class="card-actions">
                    <button class="btn btn-outline" onclick="router.showNewsDetails(${newsItem.news_id})">
                        <i class="fas fa-eye"></i>
                        Читать далее
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    async openOrderModal(serviceId) {
        if (!authManager.requireAuth()) {
            return;
        }
        
        const services = await api.getServices();
        const service = services.find(s => s.service_id == serviceId);
        
        if (!service) {
            showNotification('Услуга не найдена', 'error');
            return;
        }
        
        const modalBody = document.getElementById('order-modal-body');
        modalBody.innerHTML = `
            <form id="order-form">
                <div class="service-info">
                    <h4>${service.name}</h4>
                    <p>${service.description}</p>
                    <div class="service-price">Цена: <strong>${service.price} UAH</strong></div>
                </div>
                
                <div class="form-group">
                    <label>Дополнительные комментарии</label>
                    <textarea id="order-comments" rows="3" placeholder="Опишите детали заказа..."></textarea>
                </div>
                
                <div class="payment-methods">
                    <h4>Способ оплаты</h4>
                    <div class="payment-options">
                        <div class="payment-option" data-method="uah">
                            <div class="payment-icon">₴</div>
                            <div class="payment-name">UAH</div>
                            <div class="payment-description">Карта ПриватБанк</div>
                        </div>
                        <div class="payment-option" data-method="ton">
                            <div class="payment-icon">💎</div>
                            <div class="payment-name">TON</div>
                            <div class="payment-description">TON кошелек</div>
                        </div>
                        <div class="payment-option" data-method="usdt">
                            <div class="payment-icon">₮</div>
                            <div class="payment-name">USDT</div>
                            <div class="payment-description">TRC20 кошелек</div>
                        </div>
                    </div>
                </div>
                
                <div id="payment-details" style="display: none;">
                    <!-- Payment details will be shown here -->
                </div>
                
                <div class="form-group" id="proof-upload" style="display: none;">
                    <label>Скриншот оплаты *</label>
                    <input type="file" id="payment-proof" accept="image/*" required>
                    <small>Загрузите скриншот подтверждения перевода</small>
                </div>
                
                <input type="hidden" id="service-id" value="${serviceId}">
                <input type="hidden" id="payment-method" value="">
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal('order-modal')">
                        Отмена
                    </button>
                    <button type="submit" class="btn btn-primary" id="submit-order-btn" disabled>
                        <i class="fas fa-check"></i>
                        Оформить заказ
                    </button>
                </div>
            </form>
        `;
        
        this.bindOrderFormEvents();
        openModal('order-modal');
    }
    
    bindOrderFormEvents() {
        // Payment method selection
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.payment-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                
                const method = option.dataset.method;
                document.getElementById('payment-method').value = method;
                this.showPaymentDetails(method);
                
                document.getElementById('submit-order-btn').disabled = false;
            });
        });
        
        // Order form submission
        document.getElementById('order-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitOrder();
        });
    }
    
    showPaymentDetails(method) {
        const detailsContainer = document.getElementById('payment-details');
        const proofUpload = document.getElementById('proof-upload');
        
        let walletAddress = '';
        let currency = '';
        
        switch (method) {
            case 'uah':
                walletAddress = '4149 6090 1876 9549';
                currency = 'UAH';
                break;
            case 'ton':
                walletAddress = 'UQCKtm0RoDtPCyObq18G-FKehsDPaVIiVX5Z8q78P_XfmTUh';
                currency = 'TON';
                break;
            case 'usdt':
                walletAddress = 'TYourUSDTAddressHere'; // Замените на ваш адрес
                currency = 'USDT (TRC20)';
                break;
        }
        
        detailsContainer.innerHTML = `
            <div class="wallet-info">
                <h5>Реквизиты для оплаты ${currency}:</h5>
                <div class="wallet-address">
                    <input type="text" value="${walletAddress}" readonly>
                    <button type="button" class="copy-btn" onclick="this.copyWalletAddress('${walletAddress}')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <p><small>Переведите указанную сумму и загрузите скриншот</small></p>
            </div>
        `;
        
        detailsContainer.style.display = 'block';
        proofUpload.style.display = 'block';
    }
    
    copyWalletAddress(address) {
        navigator.clipboard.writeText(address).then(() => {
            showNotification('Адрес скопирован', 'success');
        });
    }
    
    async submitOrder() {
        const serviceId = document.getElementById('service-id').value;
        const comments = document.getElementById('order-comments').value;
        const paymentMethod = document.getElementById('payment-method').value;
        const paymentProof = document.getElementById('payment-proof').files[0];
        
        if (!paymentMethod) {
            showNotification('Выберите способ оплаты', 'error');
            return;
        }
        
        if (!paymentProof) {
            showNotification('Загрузите скриншот оплаты', 'error');
            return;
        }
        
        try {
            loadingManager.show('order-submit');
            
            const orderData = {
                service_id: serviceId,
                comments: comments,
                payment_method: paymentMethod,
                payment_proof: paymentProof
            };
            
            const result = await api.createOrder(orderData);
            
            closeModal('order-modal');
            showNotification('Заказ успешно оформлен! Ожидайте подтверждения.', 'success');
            
        } catch (error) {
            showNotification(error.message || 'Ошибка оформления заказа', 'error');
        } finally {
            loadingManager.hide('order-submit');
        }
    }
    
    initCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number[data-count]');
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.count);
                    AnimationUtils.animateCounter(entry.target, target);
                    counterObserver.unobserve(entry.target);
                }
            });
        });
        
        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }
    
    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
}

// Initialize router
let router;
document.addEventListener('DOMContentLoaded', () => {
    router = new PhantomRouter();
});

window.router = router;