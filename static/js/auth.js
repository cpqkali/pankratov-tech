// Phantom Services - Enhanced Authentication System

class PhantomAuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.adminEmails = ['admin_phantom2000@phantom.com', 'aishchnko12@gmail.com'];
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
        
        // Google Sign-In button
        const googleBtn = document.getElementById('google-signin-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                this.initGoogleSignIn();
            });
        }
        
        // Google Sign-In callback
        window.handleGoogleLogin = (response) => {
            this.handleGoogleLogin(response);
        };
        
        // Avatar upload
        const avatarFile = document.getElementById('avatar-file');
        if (avatarFile) {
            avatarFile.addEventListener('change', (e) => {
                this.previewAvatar(e.target.files[0]);
            });
        }
    }
    
    initGoogleSignIn() {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: '957687109285-gs24ojtjhjkatpi7n0rrpb1c57tf95e2.apps.googleusercontent.com',
                callback: this.handleGoogleLogin.bind(this)
            });
            
            google.accounts.id.prompt();
        } else {
            showNotification('Google Sign-In недоступен', 'error');
        }
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
            
            // Check if admin
            if (this.adminEmails.includes(email)) {
                this.currentUser.is_admin = true;
            }
            
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
        const countryCode = document.getElementById('country-code').value;
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
            
            const fullPhone = phone ? `${countryCode}${phone}` : '';
            
            const response = await api.register({
                name,
                email,
                phone: fullPhone,
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
            
            // Check if admin
            if (this.adminEmails.includes(this.currentUser.email)) {
                this.currentUser.is_admin = true;
            }
            
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
            
            // Check if admin
            if (this.adminEmails.includes(user.email)) {
                this.currentUser.is_admin = true;
            }
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
            
            // Redirect to home if on admin page
            if (window.location.pathname === '/admin') {
                router.navigate('/');
            }
        }
    }
    
    updateUI() {
        // Update cabinet section if on cabinet page
        if (window.location.pathname === '/cabinet') {
            this.updateCabinetSection();
        }
        
        // Show/hide admin navigation
        this.updateAdminNavigation();
    }
    
    updateAdminNavigation() {
        const adminNavLink = document.getElementById('admin-nav-link');
        if (adminNavLink) {
            if (this.isAuthenticated && this.currentUser && this.currentUser.is_admin) {
                adminNavLink.style.display = 'block';
            } else {
                adminNavLink.style.display = 'none';
            }
        }
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
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-user-circle"></i>
                </div>
                <h2 class="empty-state-title">Войдите в личный кабинет</h2>
                <p class="empty-state-description">
                    Для доступа к личному кабинету необходимо войти в систему
                </p>
                <button class="btn btn-primary btn-large" onclick="openModal('login-modal')">
                    <i class="fas fa-sign-in-alt"></i>
                    Войти в систему
                </button>
            </div>
        `;
    }
    
    renderUserDashboard() {
        const user = this.currentUser;
        const avatarUrl = user.avatar_url || 'static/images/default-avatar.png';
        
        return `
            <div class="cabinet-header">
                <div class="user-info">
                    <div class="user-avatar-container">
                        <img src="${avatarUrl}" alt="Avatar" class="user-avatar" onclick="openModal('avatar-modal')">
                        <div class="avatar-edit-btn" onclick="openModal('avatar-modal')">
                            <i class="fas fa-camera"></i>
                        </div>
                    </div>
                    <div class="user-details">
                        <h2>${user.name}</h2>
                        <p>${user.email}</p>
                        <p>Заказов: ${user.orders_count || 0}</p>
                    </div>
                </div>
                <button class="btn btn-outline" onclick="authManager.logout()">
                    <i class="fas fa-sign-out-alt"></i>
                    Выйти
                </button>
            </div>
            
            <div class="cabinet-tabs">
                <div class="tab-nav">
                    <button class="tab-btn active" data-tab="orders">
                        <i class="fas fa-shopping-cart"></i>
                        Мои заказы
                    </button>
                    <button class="tab-btn" data-tab="downloads">
                        <i class="fas fa-download"></i>
                        Мои скачивания
                    </button>
                    <button class="tab-btn" data-tab="chat">
                        <i class="fas fa-comments"></i>
                        Чат с админом
                    </button>
                    <button class="tab-btn" data-tab="profile">
                        <i class="fas fa-user"></i>
                        Профиль
                    </button>
                </div>
                
                <div class="tab-content active" id="orders-tab">
                    <div class="orders-list" id="orders-list">
                        <div class="loading">Загрузка заказов...</div>
                    </div>
                </div>
                
                <div class="tab-content" id="downloads-tab">
                    <div class="downloads-list" id="downloads-list">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-download"></i>
                            </div>
                            <h3 class="empty-state-title">Нет скачиваний</h3>
                            <p class="empty-state-description">
                                Здесь будут отображаться ваши скачанные программы
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="tab-content" id="chat-tab">
                    <div class="chat-container">
                        <div class="chat-messages" id="cabinet-chat-messages">
                            <div class="chat-message admin">
                                <div class="message-avatar">👻</div>
                                <div class="message-content">
                                    <div class="message-text">Здравствуйте! Чем могу помочь?</div>
                                    <div class="message-time">Сейчас</div>
                                </div>
                            </div>
                        </div>
                        <div class="chat-input">
                            <input type="text" id="cabinet-chat-input" placeholder="Введите сообщение...">
                            <button class="btn btn-primary" onclick="authManager.sendChatMessage()">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
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
                                <option value="UA" ${user.country === 'UA' ? 'selected' : ''}>🇺🇦 Украина</option>
                                <option value="RU" ${user.country === 'RU' ? 'selected' : ''}>🇷🇺 Россия</option>
                                <option value="BY" ${user.country === 'BY' ? 'selected' : ''}>🇧🇾 Беларусь</option>
                                <option value="KZ" ${user.country === 'KZ' ? 'selected' : ''}>🇰🇿 Казахстан</option>
                                <option value="US" ${user.country === 'US' ? 'selected' : ''}>🇺🇸 США</option>
                                <option value="DE" ${user.country === 'DE' ? 'selected' : ''}>🇩🇪 Германия</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            Сохранить
                        </button>
                    </form>
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
        
        // Chat input
        const chatInput = document.getElementById('cabinet-chat-input');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
        
        // Load user data
        this.loadUserOrders();
        this.loadUserDownloads();
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
                ordersList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <h3 class="empty-state-title">Нет заказов</h3>
                        <p class="empty-state-description">
                            У вас пока нет заказов. Перейдите в раздел услуг, чтобы сделать заказ.
                        </p>
                        <button class="btn btn-primary" onclick="router.navigate('/services')">
                            <i class="fas fa-plus"></i>
                            Заказать услугу
                        </button>
                    </div>
                `;
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
            ordersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3 class="empty-state-title">Ошибка загрузки</h3>
                    <p class="empty-state-description">
                        Не удалось загрузить заказы. Попробуйте позже.
                    </p>
                </div>
            `;
            console.error('Failed to load orders:', error);
        }
    }
    
    async loadUserDownloads() {
        const downloadsList = document.getElementById('downloads-list');
        if (!downloadsList) return;
        
        // Mock downloads data for now
        const downloads = [
            {
                id: 1,
                name: 'Phantom Optimizer',
                version: '2.1.0',
                size: '15.2 MB',
                download_date: new Date().toISOString(),
                icon: 'fas fa-rocket'
            }
        ];
        
        if (downloads.length === 0) {
            downloadsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-download"></i>
                    </div>
                    <h3 class="empty-state-title">Нет скачиваний</h3>
                    <p class="empty-state-description">
                        Здесь будут отображаться ваши скачанные программы
                    </p>
                </div>
            `;
            return;
        }
        
        downloadsList.innerHTML = downloads.map(download => `
            <div class="download-item">
                <div class="download-icon">
                    <i class="${download.icon}"></i>
                </div>
                <div class="download-info">
                    <div class="download-name">${download.name}</div>
                    <div class="download-meta">
                        v${download.version} • ${download.size} • ${new Date(download.download_date).toLocaleDateString()}
                    </div>
                </div>
                <div class="download-actions">
                    <button class="btn btn-outline btn-small">
                        <i class="fas fa-download"></i>
                        Скачать снова
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    sendChatMessage() {
        const input = document.getElementById('cabinet-chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        const messagesContainer = document.getElementById('cabinet-chat-messages');
        
        // Add user message
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user';
        userMessage.innerHTML = `
            <div class="message-avatar">
                <img src="${this.currentUser.avatar_url || 'static/images/default-avatar.png'}" alt="User">
            </div>
            <div class="message-content">
                <div class="message-text">${message}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        messagesContainer.appendChild(userMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        input.value = '';
        
        // Simulate admin response
        setTimeout(() => {
            const adminMessage = document.createElement('div');
            adminMessage.className = 'chat-message admin';
            adminMessage.innerHTML = `
                <div class="message-avatar">👻</div>
                <div class="message-content">
                    <div class="message-text">Спасибо за ваше сообщение! Администратор ответит в ближайшее время.</div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                </div>
            `;
            
            messagesContainer.appendChild(adminMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000);
    }
    
    previewAvatar(file) {
        if (!file) return;
        
        if (!FileUtils.validateFileType(file, ['image/jpeg', 'image/jpg', 'image/png'])) {
            showNotification('Выберите изображение в формате JPG или PNG', 'error');
            return;
        }
        
        if (!FileUtils.validateFileSize(file, 5 * 1024 * 1024)) { // 5MB
            showNotification('Размер файла не должен превышать 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImage = document.getElementById('preview-image');
            if (previewImage) {
                previewImage.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
    
    async uploadAvatar() {
        const fileInput = document.getElementById('avatar-file');
        const file = fileInput.files[0];
        
        if (!file) {
            showNotification('Выберите файл', 'error');
            return;
        }
        
        try {
            loadingManager.show('avatar-upload');
            
            // In a real app, you would upload to server
            // For now, just update locally
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentUser.avatar_url = e.target.result;
                this.updateUI();
                closeModal('avatar-modal');
                showNotification('Аватар обновлен', 'success');
            };
            reader.readAsDataURL(file);
            
        } catch (error) {
            showNotification(error.message || 'Ошибка загрузки аватара', 'error');
        } finally {
            loadingManager.hide('avatar-upload');
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
    
    isAdmin() {
        return this.isAuthenticated && this.currentUser && this.currentUser.is_admin;
    }
}

// Global functions for avatar upload
function uploadAvatar() {
    if (authManager) {
        authManager.uploadAvatar();
    }
}

// Initialize auth manager
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new PhantomAuthManager();
});

window.authManager = authManager;