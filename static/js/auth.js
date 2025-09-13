// Pankratov Tech - Authentication System

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }
    
    async init() {
        // Check if user is already logged in
        if (api.hasToken()) {
            try {
                await this.loadCurrentUser();
            } catch (error) {
                console.error('Failed to load current user:', error);
                api.clearToken();
            }
        }
        
        this.bindEvents();
        this.updateUI();
    }
    
    bindEvents() {
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchAuthTab(tab.dataset.tab);
            });
        });
        
        // Login form
        const loginForm = document.getElementById('email-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailLogin();
            });
        }
        
        // Register form
        const registerForm = document.getElementById('email-register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailRegister();
            });
        }
        
        // Google Sign-In callback
        window.handleGoogleLogin = (response) => {
            this.handleGoogleLogin(response);
        };
    }
    
    switchAuthTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}-form`).classList.add('active');
    }
    
    async handleEmailLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!FormUtils.validateEmail(email)) {
            showNotification('Введите корректный email', 'error');
            return;
        }
        
        if (!FormUtils.validatePassword(password)) {
            showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }
        
        try {
            loadingManager.show('login');
            const response = await api.login(email, password);
            
            this.currentUser = response.user;
            this.isAuthenticated = true;
            
            closeModal('login-modal');
            showNotification('Добро пожаловать!', 'success');
            this.updateUI();
            
        } catch (error) {
            showNotification(error.message || 'Ошибка входа', 'error');
        } finally {
            loadingManager.hide('login');
        }
    }
    
    async handleEmailRegister() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const country = document.getElementById('register-country').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Validation
        if (!name.trim()) {
            showNotification('Введите имя', 'error');
            return;
        }
        
        if (!FormUtils.validateEmail(email)) {
            showNotification('Введите корректный email', 'error');
            return;
        }
        
        if (phone && !FormUtils.validatePhone(phone)) {
            showNotification('Введите корректный номер телефона', 'error');
            return;
        }
        
        if (!country) {
            showNotification('Выберите страну', 'error');
            return;
        }
        
        if (!FormUtils.validatePassword(password)) {
            showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        try {
            loadingManager.show('register');
            const response = await api.register({
                name,
                email,
                phone,
                country,
                password
            });
            
            this.currentUser = response.user;
            this.isAuthenticated = true;
            
            closeModal('login-modal');
            showNotification('Регистрация успешна! Добро пожаловать!', 'success');
            this.updateUI();
            
        } catch (error) {
            showNotification(error.message || 'Ошибка регистрации', 'error');
        } finally {
            loadingManager.hide('register');
        }
    }
    
    async handleGoogleLogin(response) {
        try {
            loadingManager.show('google-login');
            const result = await api.googleLogin(response.credential);
            
            this.currentUser = result.user;
            this.isAuthenticated = true;
            
            closeModal('login-modal');
            showNotification('Добро пожаловать!', 'success');
            this.updateUI();
            
        } catch (error) {
            showNotification(error.message || 'Ошибка входа через Google', 'error');
        } finally {
            loadingManager.hide('google-login');
        }
    }
    
    async loadCurrentUser() {
        try {
            const user = await api.getCurrentUser();
            this.currentUser = user;
            this.isAuthenticated = true;
        } catch (error) {
            this.currentUser = null;
            this.isAuthenticated = false;
            throw error;
        }
    }
    
    async logout() {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.currentUser = null;
            this.isAuthenticated = false;
            this.updateUI();
            showNotification('Вы вышли из системы', 'info');
        }
    }
    
    updateUI() {
        // Update cabinet section
        this.updateCabinetSection();
        
        // Update navigation if needed
        this.updateNavigation();
    }
    
    updateCabinetSection() {
        const cabinetContent = document.getElementById('cabinet-content');
        if (!cabinetContent) return;
        
        if (this.isAuthenticated && this.currentUser) {
            cabinetContent.innerHTML = this.renderUserDashboard();
            this.bindDashboardEvents();
        } else {
            cabinetContent.innerHTML = this.renderLoginPrompt();
        }
    }
    
    renderLoginPrompt() {
        return `
            <div class="login-prompt">
                <h2 data-lang="cabinet_login_title">Войдите в личный кабинет</h2>
                <p data-lang="cabinet_login_subtitle">Для доступа к личному кабинету необходимо войти в систему</p>
                <button class="btn btn-primary btn-large" onclick="openModal('login-modal')" data-lang="cabinet_login_btn">
                    <i class="fas fa-sign-in-alt"></i>
                    Войти в систему
                </button>
            </div>
        `;
    }
    
    renderUserDashboard() {
        const user = this.currentUser;
        return `
            <div class="user-dashboard">
                <div class="user-profile">
                    <img src="${user.avatar_url || '/static/images/default-avatar.png'}" alt="Avatar" class="user-avatar">
                    <div class="user-info">
                        <h3>${user.name}</h3>
                        <div class="user-detail">
                            <span class="user-detail-label">ID:</span>
                            <span class="user-detail-value">${user.user_id}</span>
                        </div>
                        <div class="user-detail">
                            <span class="user-detail-label">Email:</span>
                            <span class="user-detail-value">${user.email}</span>
                        </div>
                        <div class="user-detail">
                            <span class="user-detail-label">Страна:</span>
                            <span class="user-detail-value">${user.country || 'Не указана'}</span>
                        </div>
                        <div class="user-detail">
                            <span class="user-detail-label">Заказов:</span>
                            <span class="user-detail-value">${user.orders_count || 0}</span>
                        </div>
                    </div>
                    <button class="btn btn-outline full-width" onclick="authManager.logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Выйти
                    </button>
                </div>
                
                <div class="dashboard-tabs">
                    <div class="tab-nav">
                        <button class="tab-btn active" data-tab="orders" data-lang="my_orders">Мои заказы</button>
                        <button class="tab-btn" data-tab="profile">Профиль</button>
                        <button class="tab-btn" data-tab="notifications">Уведомления</button>
                    </div>
                    
                    <div class="tab-content active" id="orders-tab">
                        <div class="orders-list" id="orders-list">
                            <div class="loading">Загрузка заказов...</div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="profile-tab">
                        <form id="profile-form">
                            <div class="form-group">
                                <label>Имя</label>
                                <input type="text" id="profile-name" value="${user.name}">
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="profile-email" value="${user.email}" readonly>
                            </div>
                            <div class="form-group">
                                <label>Телефон</label>
                                <input type="tel" id="profile-phone" value="${user.phone || ''}">
                            </div>
                            <div class="form-group">
                                <label>Страна</label>
                                <select id="profile-country">
                                    <option value="">Выберите страну</option>
                                    <option value="UA" ${user.country === 'UA' ? 'selected' : ''}>Украина</option>
                                    <option value="RU" ${user.country === 'RU' ? 'selected' : ''}>Россия</option>
                                    <option value="BY" ${user.country === 'BY' ? 'selected' : ''}>Беларусь</option>
                                    <option value="KZ" ${user.country === 'KZ' ? 'selected' : ''}>Казахстан</option>
                                    <option value="US" ${user.country === 'US' ? 'selected' : ''}>США</option>
                                    <option value="DE" ${user.country === 'DE' ? 'selected' : ''}>Германия</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i>
                                Сохранить
                            </button>
                        </form>
                    </div>
                    
                    <div class="tab-content" id="notifications-tab">
                        <div id="notifications-list">
                            <div class="loading">Загрузка уведомлений...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    bindDashboardEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchDashboardTab(btn.dataset.tab);
            });
        });
        
        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }
        
        // Load orders
        this.loadUserOrders();
    }
    
    switchDashboardTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');
    }
    
    async loadUserOrders() {
        const ordersList = document.getElementById('orders-list');
        if (!ordersList) return;
        
        try {
            const orders = await api.getOrders();
            
            if (orders.length === 0) {
                ordersList.innerHTML = '<p>У вас пока нет заказов</p>';
                return;
            }
            
            ordersList.innerHTML = orders.map(order => `
                <div class="order-item">
                    <div class="order-header">
                        <span class="order-id">#${order.order_id}</span>
                        <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span>
                    </div>
                    <h4>${order.service_name}</h4>
                    <div class="order-details">
                        <span>Дата: ${new Date(order.created_at).toLocaleDateString()}</span>
                        <span class="order-price">${order.price} UAH</span>
                    </div>
                    ${order.status === 'pending' ? `
                        <button class="btn btn-outline btn-small" onclick="authManager.cancelOrder(${order.order_id})">
                            <i class="fas fa-times"></i>
                            Отменить
                        </button>
                    ` : ''}
                </div>
            `).join('');
            
        } catch (error) {
            ordersList.innerHTML = '<p>Ошибка загрузки заказов</p>';
            console.error('Failed to load orders:', error);
        }
    }
    
    async updateProfile() {
        const name = document.getElementById('profile-name').value;
        const phone = document.getElementById('profile-phone').value;
        const country = document.getElementById('profile-country').value;
        
        try {
            loadingManager.show('profile-update');
            await api.updateProfile({ name, phone, country });
            
            // Update current user data
            this.currentUser.name = name;
            this.currentUser.phone = phone;
            this.currentUser.country = country;
            
            showNotification('Профиль обновлен', 'success');
            
        } catch (error) {
            showNotification(error.message || 'Ошибка обновления профиля', 'error');
        } finally {
            loadingManager.hide('profile-update');
        }
    }
    
    async cancelOrder(orderId) {
        if (!confirm('Вы уверены, что хотите отменить заказ?')) {
            return;
        }
        
        try {
            await api.cancelOrder(orderId);
            showNotification('Заказ отменен', 'success');
            this.loadUserOrders(); // Reload orders
        } catch (error) {
            showNotification(error.message || 'Ошибка отмены заказа', 'error');
        }
    }
    
    getStatusText(status) {
        const statusTexts = {
            pending: 'Ожидает',
            approved: 'Одобрен',
            rejected: 'Отклонен',
            completed: 'Завершен',
            cancelled: 'Отменен'
        };
        return statusTexts[status] || status;
    }
    
    updateNavigation() {
        // Add admin link if user is admin
        if (this.currentUser && this.currentUser.is_admin) {
            // Add admin navigation item
        }
    }
    
    requireAuth() {
        if (!this.isAuthenticated) {
            openModal('login-modal');
            return false;
        }
        return true;
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isLoggedIn() {
        return this.isAuthenticated;
    }
}

// Initialize auth manager
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});

// Export for global use
window.authManager = authManager;