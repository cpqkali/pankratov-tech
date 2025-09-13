// Pankratov Tech - Main Application

class PankratovTechApp {
    constructor() {
        this.currentSection = 'home';
        this.services = [];
        this.programs = [];
        this.news = [];
        this.init();
    }
    
    async init() {
        this.bindEvents();
        this.initNavigation();
        this.initMobileMenu();
        this.initScrollEffects();
        
        // Load initial data
        await this.loadData();
        
        // Initialize counter animations
        this.initCounterAnimations();
        
        // Update language after everything is loaded
        if (window.languageManager) {
            languageManager.updateLanguage();
        }
    }
    
    bindEvents() {
        // Service order buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.order-service-btn')) {
                const serviceId = e.target.dataset.serviceId;
                this.openOrderModal(serviceId);
            }
            
            if (e.target.matches('.download-program-btn')) {
                const programId = e.target.dataset.programId;
                this.downloadProgram(programId);
            }
        });
        
        // Order form submission
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitOrder();
            });
        }
    }
    
    initNavigation() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.navigateToSection(section);
            });
        });
        
        // Update active nav on scroll
        ScrollUtils.onScroll(() => {
            this.updateActiveNavigation();
        });
    }
    
    initMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                mobileToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
            
            // Close mobile menu when clicking on a link
            navMenu.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    mobileToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        }
    }
    
    initScrollEffects() {
        // Header scroll effect
        const header = document.getElementById('header');
        ScrollUtils.onScroll(() => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
        
        // Animate elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe cards and sections
        document.querySelectorAll('.card, .section-header').forEach(el => {
            observer.observe(el);
        });
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
    
    navigateToSection(section) {
        this.currentSection = section;
        ScrollUtils.scrollToSection(section);
        this.updateActiveNavigation();
    }
    
    updateActiveNavigation() {
        const sections = ['home', 'services', 'programs', 'news', 'cabinet'];
        let activeSection = 'home';
        
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                const rect = element.getBoundingClientRect();
                if (rect.top <= 100 && rect.bottom >= 100) {
                    activeSection = section;
                }
            }
        });
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    async loadData() {
        try {
            // Load services, programs, and news in parallel
            const [services, programs, news] = await Promise.all([
                api.getServices().catch(() => []),
                api.getPrograms().catch(() => []),
                api.getNews().catch(() => [])
            ]);
            
            this.services = services;
            this.programs = programs;
            this.news = news;
            
            this.renderServices();
            this.renderPrograms();
            this.renderNews();
            
        } catch (error) {
            console.error('Failed to load data:', error);
            showNotification('Ошибка загрузки данных', 'error');
        }
    }
    
    renderServices() {
        const servicesGrid = document.getElementById('services-grid');
        if (!servicesGrid) return;
        
        if (this.services.length === 0) {
            servicesGrid.innerHTML = '<p>Услуги временно недоступны</p>';
            return;
        }
        
        servicesGrid.innerHTML = this.services.map(service => `
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
    }
    
    renderPrograms() {
        const programsGrid = document.getElementById('programs-grid');
        if (!programsGrid) return;
        
        if (this.programs.length === 0) {
            programsGrid.innerHTML = '<p>Программы скоро появятся</p>';
            return;
        }
        
        programsGrid.innerHTML = this.programs.map(program => `
            <div class="card program-card">
                <div class="card-icon">
                    ${program.icon || '<i class="fas fa-code"></i>'}
                </div>
                <h3 class="card-title">${program.name}</h3>
                <p class="card-description">${program.description}</p>
                <div class="program-meta">
                    <span class="program-language">${program.language || 'Python'}</span>
                    <span class="program-version">v${program.version || '1.0'}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary download-program-btn" data-program-id="${program.program_id}">
                        <i class="fas fa-download"></i>
                        Скачать
                    </button>
                    <button class="btn btn-outline" onclick="this.showProgramDetails(${program.program_id})">
                        <i class="fas fa-info-circle"></i>
                        Подробнее
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderNews() {
        const newsGrid = document.getElementById('news-grid');
        if (!newsGrid) return;
        
        if (this.news.length === 0) {
            newsGrid.innerHTML = '<p>Новостей пока нет</p>';
            return;
        }
        
        newsGrid.innerHTML = this.news.map(newsItem => `
            <div class="card news-card">
                <div class="news-date">
                    ${new Date(newsItem.created_at).toLocaleDateString()}
                </div>
                <h3 class="card-title">${newsItem.title}</h3>
                <p class="card-description">${this.truncateText(newsItem.content, 150)}</p>
                <div class="card-actions">
                    <button class="btn btn-outline" onclick="app.showNewsDetails(${newsItem.news_id})">
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
        
        const service = this.services.find(s => s.service_id == serviceId);
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
                
                <div class="payment-section">
                    <h5>Оплата</h5>
                    <p>Переведите <strong>${service.price} UAH</strong> на карту ПриватБанк:</p>
                    <div class="card-number">
                        <input type="text" value="4149 6090 1876 9549" readonly>
                        <button type="button" class="btn btn-outline btn-small" onclick="this.copyCardNumber()">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Скриншот оплаты *</label>
                    <input type="file" id="payment-proof" accept="image/*" required>
                    <small>Загрузите скриншот подтверждения перевода</small>
                </div>
                
                <input type="hidden" id="service-id" value="${serviceId}">
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal('order-modal')">
                        Отмена
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-check"></i>
                        Оформить заказ
                    </button>
                </div>
            </form>
        `;
        
        // Bind form events
        const orderForm = document.getElementById('order-form');
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitOrder();
        });
        
        openModal('order-modal');
    }
    
    async submitOrder() {
        const serviceId = document.getElementById('service-id').value;
        const comments = document.getElementById('order-comments').value;
        const paymentProof = document.getElementById('payment-proof').files[0];
        
        if (!paymentProof) {
            showNotification('Загрузите скриншот оплаты', 'error');
            return;
        }
        
        // Validate file
        if (!FileUtils.validateFileType(paymentProof, ['image/jpeg', 'image/jpg', 'image/png'])) {
            showNotification('Загрузите изображение в формате JPG или PNG', 'error');
            return;
        }
        
        if (!FileUtils.validateFileSize(paymentProof, 5 * 1024 * 1024)) { // 5MB
            showNotification('Размер файла не должен превышать 5MB', 'error');
            return;
        }
        
        try {
            loadingManager.show('order-submit');
            
            const orderData = {
                service_id: serviceId,
                comments: comments,
                payment_proof: paymentProof
            };
            
            const result = await api.createOrder(orderData);
            
            closeModal('order-modal');
            showNotification('Заказ успешно оформлен! Ожидайте подтверждения.', 'success');
            
            // Download receipt
            this.downloadReceipt(result.receipt_data);
            
            // Refresh user orders if cabinet is open
            if (authManager.isLoggedIn()) {
                authManager.loadUserOrders();
            }
            
        } catch (error) {
            showNotification(error.message || 'Ошибка оформления заказа', 'error');
        } finally {
            loadingManager.hide('order-submit');
        }
    }
    
    async downloadProgram(programId) {
        const program = this.programs.find(p => p.program_id == programId);
        if (!program) {
            showNotification('Программа не найдена', 'error');
            return;
        }
        
        try {
            loadingManager.show('program-download');
            
            const blob = await api.downloadProgram(programId);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${program.name}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('Загрузка началась', 'success');
            
        } catch (error) {
            showNotification(error.message || 'Ошибка загрузки программы', 'error');
        } finally {
            loadingManager.hide('program-download');
        }
    }
    
    showNewsDetails(newsId) {
        const newsItem = this.news.find(n => n.news_id == newsId);
        if (!newsItem) return;
        
        // Create news modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'news-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${newsItem.title}</h3>
                    <button class="modal-close" onclick="closeModal('news-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="news-meta">
                        <span>Дата: ${new Date(newsItem.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="news-content">
                        ${this.parseMarkdown(newsItem.content)}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        openModal('news-modal');
        
        // Remove modal after closing
        modal.addEventListener('transitionend', () => {
            if (!modal.classList.contains('active')) {
                document.body.removeChild(modal);
            }
        });
    }
    
    downloadReceipt(receiptData) {
        const content = this.generateReceiptText(receiptData);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${receiptData.receipt_id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
    
    generateReceiptText(data) {
        return `
PANKRATOV TECH
Чек об оформлении заказа

========================================
Чек ID: ${data.receipt_id}
Тип чека: Оформление заказа
========================================

Дата: ${new Date().toLocaleString()}
Заказ №: ${data.order_id}
Клиент: ${data.user_name}
Email: ${data.user_email}

Услуга: ${data.service_name}
Цена: ${data.price} UAH

Статус: Ожидает подтверждения оплаты

========================================
Спасибо за ваш заказ!
Pankratov Tech - Профессиональные IT-услуги
        `;
    }
    
    // Utility methods
    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
    
    parseMarkdown(text) {
        // Simple markdown parser
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
    
    copyCardNumber() {
        const cardInput = document.querySelector('.card-number input');
        cardInput.select();
        document.execCommand('copy');
        showNotification('Номер карты скопирован', 'success');
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PankratovTechApp();
});

// Global functions
window.app = app;