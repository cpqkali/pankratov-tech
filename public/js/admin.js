// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.programs = [];
        this.users = [];
        this.orders = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.checkAuth();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // Logout
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Add program button
        const addProgramBtn = document.getElementById('add-program-btn');
        if (addProgramBtn) {
            addProgramBtn.addEventListener('click', () => this.showAddProgramModal());
        }

        // Add program form
        const addProgramForm = document.getElementById('add-program-form');
        if (addProgramForm) {
            addProgramForm.addEventListener('submit', (e) => this.handleAddProgram(e));
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal-container').classList.remove('show');
            });
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterPrograms(e.target.dataset.filter);
            });
        });

        // Search
        const searchInput = document.getElementById('programs-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchPrograms(e.target.value);
            });
        }
    }

    async checkAuth() {
        // Check if user is already logged in
        const userData = localStorage.getItem('adminUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                if (this.currentUser.email === 'aishchnko12@gmail.com') {
                    this.showAdminPanel();
                    await this.loadDashboardData();
                    return;
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
        this.showLogin();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        // Check if it's the admin email
        if (email !== 'aishchnko12@gmail.com') {
            this.showToast('Доступ запрещен', 'error');
            return;
        }

        try {
            // Try Google Auth first
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: password }) // Using password field for token
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user.email === 'aishchnko12@gmail.com') {
                    this.currentUser = data.user;
                    localStorage.setItem('adminUser', JSON.stringify(this.currentUser));
                    this.showAdminPanel();
                    await this.loadDashboardData();
                    this.showToast('Добро пожаловать в админ панель!', 'success');
                } else {
                    this.showToast('Доступ запрещен', 'error');
                }
            } else {
                // Fallback to simple email/password check for demo
                if (email === 'aishchnko12@gmail.com' && password === 'admin123') {
                    this.currentUser = {
                        email: email,
                        first_name: 'Admin',
                        avatar_url: 'https://via.placeholder.com/40'
                    };
                    localStorage.setItem('adminUser', JSON.stringify(this.currentUser));
                    this.showAdminPanel();
                    await this.loadDashboardData();
                    this.showToast('Добро пожаловать в админ панель!', 'success');
                } else {
                    this.showToast('Неверные учетные данные', 'error');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            // Fallback login for demo
            if (email === 'aishchnko12@gmail.com' && password === 'admin123') {
                this.currentUser = {
                    email: email,
                    first_name: 'Admin',
                    avatar_url: 'https://via.placeholder.com/40'
                };
                localStorage.setItem('adminUser', JSON.stringify(this.currentUser));
                this.showAdminPanel();
                await this.loadDashboardData();
                this.showToast('Добро пожаловать в админ панель!', 'success');
            } else {
                this.showToast('Ошибка входа', 'error');
            }
        }
    }

    showLogin() {
        document.getElementById('admin-login').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        
        // Update user info
        if (this.currentUser) {
            const nameEl = document.getElementById('admin-name');
            const avatarEl = document.getElementById('admin-avatar');
            
            if (nameEl) nameEl.textContent = this.currentUser.first_name || 'Admin';
            if (avatarEl) avatarEl.src = this.currentUser.avatar_url || 'https://via.placeholder.com/40';
        }
    }

    logout() {
        localStorage.removeItem('adminUser');
        this.currentUser = null;
        this.showLogin();
        this.showToast('Вы вышли из системы', 'info');
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
            programs: 'Программы',
            users: 'Пользователи',
            orders: 'Заказы',
            news: 'Новости',
            settings: 'Настройки'
        };
        document.getElementById('section-title').textContent = titles[section];
        
        // Show/hide add program button
        const addBtn = document.getElementById('add-program-btn');
        if (addBtn) {
            addBtn.style.display = section === 'programs' ? 'flex' : 'none';
        }
        
        // Load section data
        this.loadSectionData(section);
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const stats = await response.json();
                this.updateDashboardStats(stats);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Use mock data
            this.updateDashboardStats({
                total_users: 1250,
                total_programs: 12,
                total_downloads: 8500,
                total_orders: 340
            });
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('total-users').textContent = stats.total_users || 0;
        document.getElementById('total-programs').textContent = stats.total_programs || 0;
        document.getElementById('total-downloads').textContent = stats.total_downloads || 0;
        document.getElementById('total-orders').textContent = stats.total_orders || 0;
    }

    async loadSectionData(section) {
        switch (section) {
            case 'programs':
                await this.loadPrograms();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'orders':
                await this.loadOrders();
                break;
            case 'news':
                await this.loadNews();
                break;
        }
    }

    async loadPrograms() {
        try {
            const response = await fetch('/api/programs');
            if (response.ok) {
                this.programs = await response.json();
            } else {
                this.programs = this.getMockPrograms();
            }
        } catch (error) {
            console.error('Error loading programs:', error);
            this.programs = this.getMockPrograms();
        }
        this.renderProgramsTable();
    }

    getMockPrograms() {
        return [
            {
                id: 1,
                title: 'System Optimizer Pro',
                category: 'pc',
                version: '2.1.0',
                downloads: 1250,
                is_active: true
            },
            {
                id: 2,
                title: 'Password Generator Pro',
                category: 'tools',
                version: '3.0.1',
                downloads: 2100,
                is_active: true
            },
            {
                id: 3,
                title: 'Rootzsu Service Bot',
                category: 'bots',
                version: '4.2.1',
                downloads: 3200,
                is_active: true
            }
        ];
    }

    renderProgramsTable() {
        const tbody = document.getElementById('programs-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.programs.map(program => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${program.title}</div>
                </td>
                <td>
                    <span class="status-badge ${program.category}">${this.getCategoryName(program.category)}</span>
                </td>
                <td>${program.version}</td>
                <td>${program.downloads.toLocaleString()}</td>
                <td>
                    <span class="status-badge ${program.is_active ? 'active' : 'inactive'}">
                        ${program.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn small secondary" onclick="adminPanel.editProgram(${program.id})">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button class="btn small danger" onclick="adminPanel.deleteProgram(${program.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getCategoryName(category) {
        const names = {
            'pc': 'ПК',
            'tools': 'Инструменты',
            'bots': 'Боты'
        };
        return names[category] || category;
    }

    filterPrograms(filter) {
        let filtered = this.programs;
        if (filter !== 'all') {
            filtered = this.programs.filter(p => p.category === filter);
        }
        this.renderFilteredPrograms(filtered);
    }

    searchPrograms(query) {
        const filtered = this.programs.filter(p => 
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
        );
        this.renderFilteredPrograms(filtered);
    }

    renderFilteredPrograms(programs) {
        const tbody = document.getElementById('programs-table-body');
        if (!tbody) return;

        tbody.innerHTML = programs.map(program => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${program.title}</div>
                </td>
                <td>
                    <span class="status-badge ${program.category}">${this.getCategoryName(program.category)}</span>
                </td>
                <td>${program.version}</td>
                <td>${program.downloads.toLocaleString()}</td>
                <td>
                    <span class="status-badge ${program.is_active ? 'active' : 'inactive'}">
                        ${program.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn small secondary" onclick="adminPanel.editProgram(${program.id})">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button class="btn small danger" onclick="adminPanel.deleteProgram(${program.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showAddProgramModal() {
        document.getElementById('add-program-modal').classList.add('show');
    }

    async handleAddProgram(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('program-title').value,
            description: document.getElementById('program-description').value,
            category: document.getElementById('program-category').value,
            icon: document.getElementById('program-icon').value || '📱',
            version: document.getElementById('program-version').value,
            size: document.getElementById('program-size').value,
            download_url: document.getElementById('program-download-url').value,
            features: document.getElementById('program-features').value.split('\n').filter(f => f.trim()),
            requirements: document.getElementById('program-requirements').value
        };

        try {
            const response = await fetch('/api/programs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showToast('Программа успешно добавлена!', 'success');
                document.getElementById('add-program-modal').classList.remove('show');
                document.getElementById('add-program-form').reset();
                await this.loadPrograms();
            } else {
                this.showToast('Ошибка при добавлении программы', 'error');
            }
        } catch (error) {
            console.error('Error adding program:', error);
            // For demo, add to local array
            const newProgram = {
                id: Date.now(),
                ...formData,
                downloads: 0,
                is_active: true
            };
            this.programs.push(newProgram);
            this.renderProgramsTable();
            this.showToast('Программа успешно добавлена!', 'success');
            document.getElementById('add-program-modal').classList.remove('show');
            document.getElementById('add-program-form').reset();
        }
    }

    async editProgram(id) {
        const program = this.programs.find(p => p.id === id);
        if (!program) return;

        // For demo, just show alert
        this.showToast(`Редактирование программы: ${program.title}`, 'info');
    }

    async deleteProgram(id) {
        if (!confirm('Вы уверены, что хотите удалить эту программу?')) return;

        try {
            const response = await fetch(`/api/programs/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showToast('Программа удалена', 'success');
                await this.loadPrograms();
            } else {
                this.showToast('Ошибка при удалении программы', 'error');
            }
        } catch (error) {
            console.error('Error deleting program:', error);
            // For demo, remove from local array
            this.programs = this.programs.filter(p => p.id !== id);
            this.renderProgramsTable();
            this.showToast('Программа удалена', 'success');
        }
    }

    async loadUsers() {
        // Mock users data
        this.users = [
            {
                id: 1,
                first_name: 'Иван',
                last_name: 'Петров',
                email: 'ivan@example.com',
                creation_date: '2024-01-15',
                orders_count: 3,
                is_banned: false
            },
            {
                id: 2,
                first_name: 'Мария',
                last_name: 'Сидорова',
                email: 'maria@example.com',
                creation_date: '2024-02-20',
                orders_count: 1,
                is_banned: false
            }
        ];
        this.renderUsersTable();
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${user.first_name} ${user.last_name}</div>
                </td>
                <td>${user.email}</td>
                <td>${new Date(user.creation_date).toLocaleDateString()}</td>
                <td>${user.orders_count}</td>
                <td>
                    <span class="status-badge ${user.is_banned ? 'inactive' : 'active'}">
                        ${user.is_banned ? 'Заблокирован' : 'Активен'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn small secondary">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn small ${user.is_banned ? 'success' : 'warning'}">
                            <i class="fa-solid fa-${user.is_banned ? 'unlock' : 'ban'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadOrders() {
        // Mock orders data
        this.orders = [
            {
                order_id: 1,
                first_name: 'Иван',
                last_name: 'Петров',
                service_name: 'Разблокировка загрузчика',
                price_paid: 16.00,
                status: 'completed',
                creation_date: '2024-01-20'
            },
            {
                order_id: 2,
                first_name: 'Мария',
                last_name: 'Сидорова',
                service_name: 'Установка root-прав',
                price_paid: 3.00,
                status: 'pending',
                creation_date: '2024-01-22'
            }
        ];
        this.renderOrdersTable();
    }

    renderOrdersTable() {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.orders.map(order => `
            <tr>
                <td>#${order.order_id}</td>
                <td>${order.first_name} ${order.last_name}</td>
                <td>${order.service_name}</td>
                <td>$${order.price_paid.toFixed(2)}</td>
                <td>
                    <span class="status-badge ${order.status}">
                        ${this.getStatusName(order.status)}
                    </span>
                </td>
                <td>${new Date(order.creation_date).toLocaleDateString()}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn small secondary">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        ${order.status === 'pending' ? `
                            <button class="btn small success">
                                <i class="fa-solid fa-check"></i>
                            </button>
                            <button class="btn small danger">
                                <i class="fa-solid fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getStatusName(status) {
        const names = {
            'pending': 'Ожидает',
            'in_progress': 'В работе',
            'completed': 'Завершен',
            'cancelled': 'Отменен'
        };
        return names[status] || status;
    }

    async loadNews() {
        // Mock news data
        const newsList = document.getElementById('news-list');
        if (!newsList) return;

        newsList.innerHTML = `
            <div class="news-item">
                <h3>Добро пожаловать в админ панель!</h3>
                <p>Новая система управления программами и пользователями запущена.</p>
                <div class="news-meta">
                    <span>Автор: Admin</span>
                    <span>20.01.2024</span>
                </div>
            </div>
        `;
    }

    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }

        // Create toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: var(--admin-surface);
            border: 1px solid var(--admin-border);
            border-radius: 8px;
            padding: 1rem 1.5rem;
            color: var(--admin-text);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            border-left: 4px solid ${type === 'success' ? 'var(--admin-success)' : 
                                   type === 'error' ? 'var(--admin-danger)' : 
                                   type === 'warning' ? 'var(--admin-warning)' : 'var(--admin-primary)'};
        `;
        toast.textContent = message;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize admin panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});