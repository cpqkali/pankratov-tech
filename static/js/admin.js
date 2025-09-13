// Pankratov Tech - Admin Panel JavaScript

class AdminApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentUser = null;
        this.orders = [];
        this.programs = [];
        this.news = [];
        this.users = [];
        this.stats = {};
        this.init();
    }
    
    async init() {
        // Check authentication
        if (!api.hasToken()) {
            window.location.href = '/';
            return;
        }
        
        try {
            // Load current user and verify admin access
            this.currentUser = await api.getCurrentUser();
            
            if (!this.currentUser.is_admin) {
                showNotification('Доступ запрещен', 'error');
                window.location.href = '/';
                return;
            }
            
            this.updateUserInfo();
            this.bindEvents();
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('Admin init error:', error);
            showNotification('Ошибка инициализации', 'error');
            window.location.href = '/';
        }
    }
    
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Add item button
        const addItemBtn = document.getElementById('add-item-btn');
        addItemBtn.addEventListener('click', () => {
            this.showAddModal();
        });
        
        // Forms
        this.bindFormEvents();
        
        // Search and filters
        this.bindSearchAndFilters();
    }
    
    bindFormEvents() {
        // Program form
        const programForm = document.getElementById('program-form');
        if (programForm) {
            programForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProgramSubmit();
            });
        }
        
        // News form
        const newsForm = document.getElementById('news-form');
        if (newsForm) {
            newsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsSubmit();
            });
        }
    }
    
    bindSearchAndFilters() {
        // Orders search
        const ordersSearch = document.getElementById('orders-search');
        if (ordersSearch) {
            ordersSearch.addEventListener('input', (e) => {
                this.filterOrders(e.target.value);
            });
        }
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterOrdersByStatus(e.target.dataset.filter);
            });
        });
    }
    
    updateUserInfo() {
        const adminName = document.getElementById('admin-name');
        const adminAvatar = document.getElementById('admin-avatar');
        
        if (adminName) adminName.textContent = this.currentUser.name;
        if (adminAvatar && this.currentUser.avatar_url) {
            adminAvatar.src = this.currentUser.avatar_url;
        }
    }
    
    switchSection(section) {
        this.currentSection = section;
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Update sections
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');
        
        // Update header
        const titles = {
            dashboard: 'Дашборд',
            orders: 'Список заказов',
            programs: 'Программы',
            news: 'Новости',
            users: 'Все пользователи'
        };
        document.getElementById('section-title').textContent = titles[section];
        
        // Show/hide add button
        const addBtn = document.getElementById('add-item-btn');
        const addText = document.getElementById('add-item-text');
        
        if (section === 'programs') {
            addBtn.style.display = 'flex';
            addText.textContent = 'Добавить программу';
        } else if (section === 'news') {
            addBtn.style.display = 'flex';
            addText.textContent = 'Добавить новость';
        } else {
            addBtn.style.display = 'none';
        }
        
        // Load section data
        this.loadSectionData(section);
    }
    
    async loadDashboardData() {
        try {
            loadingManager.show('dashboard');
            
            // Load stats
            this.stats = await api.getAdminStats();
            this.updateStatsDisplay();
            
            // Load recent orders for dashboard
            const recentOrders = await api.getAllOrders();
            this.renderRecentOrders(recentOrders.slice(0, 5));
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showNotification('Ошибка загрузки данных дашборда', 'error');
        } finally {
            loadingManager.hide('dashboard');
        }
    }
    
    updateStatsDisplay() {
        document.getElementById('total-users').textContent = this.stats.total_users || 0;
        document.getElementById('total-orders').textContent = this.stats.total_orders || 0;
        document.getElementById('total-programs').textContent = this.stats.total_programs || 0;
        document.getElementById('total-news').textContent = this.stats.total_news || 0;
        document.getElementById('pending-orders').textContent = this.stats.pending_orders || 0;
        document.getElementById('total-revenue').textContent = (this.stats.total_revenue || 0).toLocaleString();
    }
    
    renderRecentOrders(orders) {
        const container = document.getElementById('recent-orders');
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<p>Нет недавних заказов</p>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="recent-item">
                <div>
                    <strong>#${order.order_id}</strong> - ${order.service_name}
                    <br>
                    <small>${order.user_name}</small>
                </div>
                <div>
                    <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span>
                </div>
            </div>
        `).join('');
    }
    
    async loadSectionData(section) {
        switch (section) {
            case 'orders':
                await this.loadOrders();
                break;
            case 'programs':
                await this.loadPrograms();
                break;
            case 'news':
                await this.loadNews();
                break;
            case 'users':
                await this.loadUsers();
                break;
        }
    }
    
    async loadOrders() {
        try {
            loadingManager.show('orders');
            this.orders = await api.getAllOrders();
            this.renderOrders(this.orders);
        } catch (error) {
            console.error('Failed to load orders:', error);
            showNotification('Ошибка загрузки заказов', 'error');
        } finally {
            loadingManager.hide('orders');
        }
    }
    
    renderOrders(orders) {
        const container = document.getElementById('orders-list');
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<p>Заказов пока нет</p>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-item" onclick="adminApp.showOrderDetails(${order.order_id})">
                <div class="order-header">
                    <span class="order-id">#${order.order_id}</span>
                    <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span>
                </div>
                
                <div class="order-info">
                    <div class="order-detail">
                        <span class="order-detail-label">Клиент</span>
                        <span class="order-detail-value">${order.user_name}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Email</span>
                        <span class="order-detail-value">${order.user_email}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Услуга</span>
                        <span class="order-detail-value">${order.service_name}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Цена</span>
                        <span class="order-detail-value">${order.price} UAH</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Дата</span>
                        <span class="order-detail-value">${new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                
                ${order.status === 'pending' ? `
                    <div class="order-actions">
                        <button class="btn btn-success btn-small" onclick="event.stopPropagation(); adminApp.approveOrder(${order.order_id})">
                            <i class="fas fa-check"></i>
                            Одобрить
                        </button>
                        <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); adminApp.rejectOrder(${order.order_id})">
                            <i class="fas fa-times"></i>
                            Отклонить
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    async showOrderDetails(orderId) {
        const order = this.orders.find(o => o.order_id === orderId);
        if (!order) return;
        
        const modalBody = document.getElementById('order-details');
        modalBody.innerHTML = `
            <div class="order-details-content">
                <div class="detail-section">
                    <h4>Информация о заказе</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>ID заказа:</label>
                            <span>#${order.order_id}</span>
                        </div>
                        <div class="detail-item">
                            <label>Статус:</label>
                            <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Дата создания:</label>
                            <span>${new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Услуга:</label>
                            <span>${order.service_name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Цена:</label>
                            <span>${order.price} UAH</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Информация о клиенте</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>ID клиента:</label>
                            <span>${order.user_id}</span>
                        </div>
                        <div class="detail-item">
                            <label>Имя:</label>
                            <span>${order.user_name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${order.user_email}</span>
                        </div>
                    </div>
                </div>
                
                ${order.comments ? `
                    <div class="detail-section">
                        <h4>Комментарии клиента</h4>
                        <p>${order.comments}</p>
                    </div>
                ` : ''}
                
                ${order.payment_proof_path ? `
                    <div class="detail-section">
                        <h4>Скриншот оплаты</h4>
                        <img src="/uploads/${order.payment_proof_path}" alt="Payment proof" style="max-width: 100%; border-radius: 8px;">
                    </div>
                ` : ''}
                
                ${order.admin_comment ? `
                    <div class="detail-section">
                        <h4>Комментарий администратора</h4>
                        <p>${order.admin_comment}</p>
                    </div>
                ` : ''}
                
                ${order.status === 'pending' ? `
                    <div class="detail-actions">
                        <button class="btn btn-success" onclick="adminApp.approveOrder(${order.order_id}); closeModal('order-modal')">
                            <i class="fas fa-check"></i>
                            Одобрить заказ
                        </button>
                        <button class="btn btn-danger" onclick="adminApp.rejectOrderWithReason(${order.order_id})">
                            <i class="fas fa-times"></i>
                            Отклонить заказ
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        openModal('order-modal');
    }
    
    async approveOrder(orderId) {
        if (!confirm('Вы уверены, что хотите одобрить этот заказ?')) {
            return;
        }
        
        try {
            await api.approveOrder(orderId);
            showNotification('Заказ одобрен', 'success');
            await this.loadOrders();
            await this.loadDashboardData();
        } catch (error) {
            showNotification(error.message || 'Ошибка одобрения заказа', 'error');
        }
    }
    
    async rejectOrder(orderId) {
        const reason = prompt('Укажите причину отклонения заказа:');
        if (!reason) return;
        
        try {
            await api.rejectOrder(orderId, reason);
            showNotification('Заказ отклонен', 'success');
            await this.loadOrders();
            await this.loadDashboardData();
        } catch (error) {
            showNotification(error.message || 'Ошибка отклонения заказа', 'error');
        }
    }
    
    async rejectOrderWithReason(orderId) {
        const reason = prompt('Укажите причину отклонения заказа:');
        if (!reason) return;
        
        try {
            await api.rejectOrder(orderId, reason);
            showNotification('Заказ отклонен', 'success');
            closeModal('order-modal');
            await this.loadOrders();
            await this.loadDashboardData();
        } catch (error) {
            showNotification(error.message || 'Ошибка отклонения заказа', 'error');
        }
    }
    
    filterOrders(searchTerm) {
        const filtered = this.orders.filter(order => 
            order.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.order_id.toString().includes(searchTerm)
        );
        this.renderOrders(filtered);
    }
    
    filterOrdersByStatus(status) {
        if (status === 'all') {
            this.renderOrders(this.orders);
        } else {
            const filtered = this.orders.filter(order => order.status === status);
            this.renderOrders(filtered);
        }
    }
    
    async loadPrograms() {
        try {
            loadingManager.show('programs');
            this.programs = await api.getPrograms();
            this.renderPrograms();
        } catch (error) {
            console.error('Failed to load programs:', error);
            showNotification('Ошибка загрузки программ', 'error');
        } finally {
            loadingManager.hide('programs');
        }
    }
    
    renderPrograms() {
        const container = document.getElementById('programs-grid');
        if (!container) return;
        
        if (this.programs.length === 0) {
            container.innerHTML = '<p>Программ пока нет</p>';
            return;
        }
        
        container.innerHTML = this.programs.map(program => `
            <div class="program-item">
                <div class="program-header">
                    <div class="program-icon">
                        ${program.icon || '<i class="fas fa-code"></i>'}
                    </div>
                    <div class="program-info">
                        <h3>${program.name}</h3>
                        <div class="program-meta">
                            <span>${program.language || 'Python'}</span>
                            <span>v${program.version || '1.0'}</span>
                            <span>${program.download_count || 0} загрузок</span>
                        </div>
                    </div>
                </div>
                <p class="program-description">${program.description}</p>
                <div class="program-actions">
                    <button class="btn btn-outline btn-small" onclick="adminApp.editProgram(${program.program_id})">
                        <i class="fas fa-edit"></i>
                        Редактировать
                    </button>
                    <button class="btn btn-danger btn-small" onclick="adminApp.deleteProgram(${program.program_id})">
                        <i class="fas fa-trash"></i>
                        Удалить
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    async loadNews() {
        try {
            loadingManager.show('news');
            this.news = await api.getNews();
            this.renderNews();
        } catch (error) {
            console.error('Failed to load news:', error);
            showNotification('Ошибка загрузки новостей', 'error');
        } finally {
            loadingManager.hide('news');
        }
    }
    
    renderNews() {
        const container = document.getElementById('news-list');
        if (!container) return;
        
        if (this.news.length === 0) {
            container.innerHTML = '<p>Новостей пока нет</p>';
            return;
        }
        
        container.innerHTML = this.news.map(newsItem => `
            <div class="news-item">
                <div class="news-header">
                    <div>
                        <h3 class="news-title">${newsItem.title}</h3>
                        <div class="news-meta">
                            Автор: ${newsItem.author_name || 'Неизвестно'} | 
                            ${new Date(newsItem.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="news-actions">
                        <button class="btn btn-outline btn-small" onclick="adminApp.editNews(${newsItem.news_id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-small" onclick="adminApp.deleteNews(${newsItem.news_id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="news-content">
                    ${this.truncateText(newsItem.content, 200)}
                </div>
            </div>
        `).join('');
    }
    
    async loadUsers() {
        try {
            loadingManager.show('users');
            this.users = await api.getAllUsers();
            this.renderUsers();
        } catch (error) {
            console.error('Failed to load users:', error);
            showNotification('Ошибка загрузки пользователей', 'error');
        } finally {
            loadingManager.hide('users');
        }
    }
    
    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Пользователей пока нет</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.user_id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.country || 'Не указана'}</td>
                <td>${user.orders_count || 0}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge ${user.is_admin ? 'admin' : 'user'}">
                        ${user.is_admin ? 'Админ' : 'Пользователь'}
                    </span>
                </td>
            </tr>
        `).join('');
    }
    
    showAddModal() {
        if (this.currentSection === 'programs') {
            document.getElementById('program-modal-title').textContent = 'Добавить программу';
            document.getElementById('program-form').reset();
            openModal('program-modal');
        } else if (this.currentSection === 'news') {
            document.getElementById('news-modal-title').textContent = 'Добавить новость';
            document.getElementById('news-form').reset();
            openModal('news-modal');
        }
    }
    
    async handleProgramSubmit() {
        const formData = {
            name: document.getElementById('program-name').value,
            description: document.getElementById('program-description').value,
            language: document.getElementById('program-language').value,
            version: document.getElementById('program-version').value,
            icon: document.getElementById('program-icon').value
        };
        
        try {
            await api.createProgram(formData);
            showNotification('Программа добавлена', 'success');
            closeModal('program-modal');
            await this.loadPrograms();
            await this.loadDashboardData();
        } catch (error) {
            showNotification(error.message || 'Ошибка добавления программы', 'error');
        }
    }
    
    async handleNewsSubmit() {
        const formData = {
            title: document.getElementById('news-title').value,
            content: document.getElementById('news-content').value
        };
        
        try {
            await api.createNews(formData);
            showNotification('Новость опубликована', 'success');
            closeModal('news-modal');
            await this.loadNews();
            await this.loadDashboardData();
        } catch (error) {
            showNotification(error.message || 'Ошибка публикации новости', 'error');
        }
    }
    
    async deleteProgram(programId) {
        if (!confirm('Вы уверены, что хотите удалить эту программу?')) {
            return;
        }
        
        try {
            await api.deleteProgram(programId);
            showNotification('Программа удалена', 'success');
            await this.loadPrograms();
            await this.loadDashboardData();
        } catch (error) {
            showNotification(error.message || 'Ошибка удаления программы', 'error');
        }
    }
    
    async deleteNews(newsId) {
        if (!confirm('Вы уверены, что хотите удалить эту новость?')) {
            return;
        }
        
        try {
            await api.deleteNews(newsId);
            showNotification('Новость удалена', 'success');
            await this.loadNews();
            await this.loadDashboardData();
        } catch (error) {
            showNotification(error.message || 'Ошибка удаления новости', 'error');
        }
    }
    
    editProgram(programId) {
        // TODO: Implement program editing
        showNotification('Редактирование программ будет добавлено позже', 'info');
    }
    
    editNews(newsId) {
        // TODO: Implement news editing
        showNotification('Редактирование новостей будет добавлено позже', 'info');
    }
    
    async logout() {
        try {
            await api.logout();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    }
    
    // Utility methods
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
    
    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
}

// Initialize admin app
let adminApp;
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminApp();
});

// Global functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function showNotification(message, type = 'info', duration = 5000) {
    if (window.notificationManager) {
        return notificationManager.show(message, type, duration);
    }
    
    // Fallback notification
    console.log(`${type.toUpperCase()}: ${message}`);
}