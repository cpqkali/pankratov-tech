// Pankratov Tech - Utility Functions

// Device Detection
class DeviceDetector {
    constructor() {
        this.userAgent = navigator.userAgent.toLowerCase();
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.isDesktop = !this.isMobile && !this.isTablet;
        this.init();
    }
    
    detectMobile() {
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(this.userAgent);
    }
    
    detectTablet() {
        return /ipad|android(?!.*mobile)|tablet/i.test(this.userAgent);
    }
    
    init() {
        // Add device classes to body
        document.body.classList.add(
            this.isMobile ? 'device-mobile' : 
            this.isTablet ? 'device-tablet' : 'device-desktop'
        );
        
        // Set CSS custom properties for responsive design
        document.documentElement.style.setProperty('--device-type', 
            this.isMobile ? 'mobile' : 
            this.isTablet ? 'tablet' : 'desktop'
        );
    }
    
    getDeviceType() {
        return this.isMobile ? 'mobile' : 
               this.isTablet ? 'tablet' : 'desktop';
    }
}

// Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notification-container');
        this.notifications = [];
    }
    
    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        // Show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
        
        return notification;
    }
    
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon ${icons[type] || icons.info}"></i>
                <div class="notification-text">
                    <div class="notification-message">${message}</div>
                </div>
                <button class="notification-close" onclick="notificationManager.remove(this.closest('.notification'))">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        return notification;
    }
    
    remove(notification) {
        if (!notification) return;
        
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 300);
    }
    
    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
    }
}

// Modal Manager
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.bindEvents();
    }
    
    bindEvents() {
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal);
            }
        });
        
        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && this.activeModal) {
                this.close(this.activeModal);
            }
        });
    }
    
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Close any active modal first
        if (this.activeModal) {
            this.close(this.activeModal);
        }
        
        modal.classList.add('active');
        this.activeModal = modal;
        document.body.style.overflow = 'hidden';
    }
    
    close(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        
        if (!modal) return;
        
        modal.classList.remove('active');
        this.activeModal = null;
        document.body.style.overflow = '';
    }
}

// Loading Manager
class LoadingManager {
    constructor() {
        this.preloader = document.getElementById('preloader');
        this.loadingStates = new Set();
    }
    
    show(id = 'default') {
        this.loadingStates.add(id);
        if (this.preloader) {
            this.preloader.style.opacity = '1';
            this.preloader.style.visibility = 'visible';
        }
    }
    
    hide(id = 'default') {
        this.loadingStates.delete(id);
        
        if (this.loadingStates.size === 0 && this.preloader) {
            this.preloader.style.opacity = '0';
            setTimeout(() => {
                this.preloader.style.visibility = 'hidden';
            }, 500);
        }
    }
    
    hideAll() {
        this.loadingStates.clear();
        this.hide();
    }
}

// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'dark';
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme);
        this.bindEvents();
    }
    
    bindEvents() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggle();
            });
        }
    }
    
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.storeTheme(theme);
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }
    
    getStoredTheme() {
        return localStorage.getItem('pankratov_theme');
    }
    
    storeTheme(theme) {
        localStorage.setItem('pankratov_theme', theme);
    }
}

// Animation Utilities
class AnimationUtils {
    static animateCounter(element, target, duration = 2000) {
        const start = 0;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (target - start) * progress);
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
    
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = Math.min(progress, 1);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    static fadeOut(element, duration = 300) {
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = Math.max(1 - progress, 0);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    }
}

// Scroll Utilities
class ScrollUtils {
    static scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.getElementById('header').offsetHeight;
            const targetPosition = section.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }
    
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    static onScroll(callback, throttle = 100) {
        let ticking = false;
        
        function update() {
            callback();
            ticking = false;
        }
        
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', requestTick);
    }
}

// Form Utilities
class FormUtils {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static validatePassword(password) {
        return password.length >= 6;
    }
    
    static validatePhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/\s/g, ''));
    }
    
    static serializeForm(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
    
    static clearForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    }
}

// File Utilities
class FileUtils {
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static validateFileType(file, allowedTypes) {
        return allowedTypes.includes(file.type);
    }
    
    static validateFileSize(file, maxSize) {
        return file.size <= maxSize;
    }
    
    static readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// Initialize utilities
let deviceDetector, notificationManager, modalManager, loadingManager, themeManager;

document.addEventListener('DOMContentLoaded', () => {
    deviceDetector = new DeviceDetector();
    notificationManager = new NotificationManager();
    modalManager = new ModalManager();
    loadingManager = new LoadingManager();
    themeManager = new ThemeManager();
    
    // Hide preloader after page load
    setTimeout(() => {
        loadingManager.hide('initial');
    }, 1500);
});

// Global utility functions
function scrollToSection(sectionId) {
    ScrollUtils.scrollToSection(sectionId);
}

function openModal(modalId) {
    modalManager.open(modalId);
}

function closeModal(modalId) {
    modalManager.close(modalId);
}

function showNotification(message, type = 'info', duration = 5000) {
    return notificationManager.show(message, type, duration);
}

// Export utilities for use in other modules
window.DeviceDetector = DeviceDetector;
window.NotificationManager = NotificationManager;
window.ModalManager = ModalManager;
window.LoadingManager = LoadingManager;
window.ThemeManager = ThemeManager;
window.AnimationUtils = AnimationUtils;
window.ScrollUtils = ScrollUtils;
window.FormUtils = FormUtils;
window.FileUtils = FileUtils;