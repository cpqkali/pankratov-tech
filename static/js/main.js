// Phantom Services - Main Application Controller

class PhantomApp {
    constructor() {
        this.services = [];
        this.programs = [];
        this.news = [];
        this.chatMessages = [];
        this.init();
    }
    
    async init() {
        this.bindGlobalEvents();
        this.initTheme();
        this.initLanguage();
        this.startClock();
        
        // Hide preloader after initialization
        setTimeout(() => {
            this.hidePreloader();
        }, 2000);
    }
    
    bindGlobalEvents() {
        // Global click handlers
        document.addEventListener('click', (e) => {
            // Close dropdowns when clicking outside
            if (!e.target.closest('.language-selector')) {
                document.getElementById('lang-dropdown')?.classList.remove('active');
            }
        });
        
        // Language selector
        const langBtn = document.getElementById('lang-btn');
        const langDropdown = document.getElementById('lang-dropdown');
        
        if (langBtn && langDropdown) {
            langBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                langDropdown.classList.toggle('active');
            });
            
            langDropdown.querySelectorAll('.lang-option').forEach(option => {
                option.addEventListener('click', () => {
                    const lang = option.dataset.lang;
                    this.setLanguage(lang);
                    langDropdown.classList.remove('active');
                });
            });
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Mobile menu
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                mobileToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
        
        // Modal close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('phantom_theme') || 'dark';
        this.setTheme(savedTheme);
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('phantom_theme', theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        // Update particle system theme
        if (window.phantomParticles) {
            phantomParticles.updateTheme(theme);
        }
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    initLanguage() {
        const savedLang = localStorage.getItem('phantom_language') || 'ru';
        this.setLanguage(savedLang);
    }
    
    setLanguage(lang) {
        localStorage.setItem('phantom_language', lang);
        
        // Update current language display
        const currentLangEl = document.getElementById('current-lang');
        if (currentLangEl) {
            currentLangEl.textContent = lang.toUpperCase();
        }
        
        // Update all translatable elements
        this.updateTranslations(lang);
    }
    
    updateTranslations(lang) {
        // This would be implemented with a proper translation system
        // For now, we'll keep the Russian interface
        document.documentElement.lang = lang;
    }
    
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const clockEl = document.getElementById('live-clock');
            if (clockEl) {
                clockEl.textContent = timeString;
            }
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
    }
    
    // Chat functionality
    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        const messagesContainer = document.getElementById('chat-messages');
        
        // Add user message
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user';
        userMessage.innerHTML = `
            <div class="message-avatar">
                <img src="${authManager.currentUser?.avatar_url || 'static/images/default-avatar.png'}" alt="User">
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
    
    // Utility methods
    formatPrice(price, currency = 'UAH') {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency === 'UAH' ? 'UAH' : 'USD'
        }).format(price);
    }
    
    formatDate(date) {
        return new Date(date).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
}

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
    if (notificationManager) {
        return notificationManager.show(message, type, duration);
    }
    console.log(`${type.toUpperCase()}: ${message}`);
}

function sendChatMessage() {
    if (window.app) {
        app.sendChatMessage();
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PhantomApp();
});

window.app = app;