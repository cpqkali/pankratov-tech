// Programs Page JavaScript
class ProgramsManager {
    constructor() {
        this.currentCategory = 'pc';
        this.programs = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadPrograms();
        this.renderPrograms();
    }

    bindEvents() {
        // Category tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchCategory(e.target.dataset.category);
            });
        });

        // Modal close
        const modal = document.getElementById('program-modal');
        const closeBtn = modal.querySelector('.modal-close-btn');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }

    async loadPrograms() {
        try {
            const response = await fetch('/api/programs');
            if (response.ok) {
                this.programs = await response.json();
            } else {
                console.error('Failed to load programs');
                this.programs = this.getDefaultPrograms();
            }
        } catch (error) {
            console.error('Error loading programs:', error);
            this.programs = this.getDefaultPrograms();
        }
    }

    getDefaultPrograms() {
        return [
            // PC Programs
            {
                id: 1,
                title: 'System Optimizer Pro',
                description: 'Мощный инструмент для оптимизации и очистки Windows системы',
                category: 'pc',
                icon: '🚀',
                downloads: 1250,
                version: '2.1.0',
                size: '15.2 MB',
                features: [
                    'Очистка реестра и временных файлов',
                    'Оптимизация автозагрузки',
                    'Дефрагментация диска',
                    'Мониторинг системы в реальном времени'
                ],
                requirements: 'Windows 10/11, 4GB RAM, 50MB свободного места',
                screenshots: ['/images/optimizer1.jpg', '/images/optimizer2.jpg'],
                download_url: '#'
            },
            {
                id: 2,
                title: 'Driver Manager',
                description: 'Автоматическое обновление и управление драйверами',
                category: 'pc',
                icon: '🔧',
                downloads: 890,
                version: '1.5.3',
                size: '8.7 MB',
                features: [
                    'Автоматический поиск драйверов',
                    'Резервное копирование драйверов',
                    'Планировщик обновлений',
                    'Детальная информация о железе'
                ],
                requirements: 'Windows 7/8/10/11, 2GB RAM, 100MB свободного места',
                screenshots: ['/images/driver1.jpg', '/images/driver2.jpg'],
                download_url: '#'
            },
            
            // Tools
            {
                id: 3,
                title: 'Password Generator Pro',
                description: 'Генератор надежных паролей с настраиваемыми параметрами',
                category: 'tools',
                icon: '🔐',
                downloads: 2100,
                version: '3.0.1',
                size: '2.1 MB',
                features: [
                    'Настраиваемая длина пароля',
                    'Различные наборы символов',
                    'Проверка надежности пароля',
                    'Экспорт в различные форматы'
                ],
                requirements: 'Любая ОС, веб-браузер',
                screenshots: ['/images/password1.jpg', '/images/password2.jpg'],
                download_url: '#'
            },
            {
                id: 4,
                title: 'File Converter Suite',
                description: 'Универсальный конвертер файлов различных форматов',
                category: 'tools',
                icon: '🔄',
                downloads: 1750,
                version: '2.8.0',
                size: '25.4 MB',
                features: [
                    'Поддержка 200+ форматов',
                    'Пакетная обработка файлов',
                    'Настройка качества конвертации',
                    'Предварительный просмотр'
                ],
                requirements: 'Windows 10/11, 8GB RAM, 500MB свободного места',
                screenshots: ['/images/converter1.jpg', '/images/converter2.jpg'],
                download_url: '#'
            },
            
            // Telegram Bots
            {
                id: 5,
                title: 'Rootzsu Service Bot',
                description: 'Официальный бот для заказа услуг и поддержки клиентов',
                category: 'bots',
                icon: '🤖',
                downloads: 3200,
                version: '4.2.1',
                size: 'Telegram Bot',
                features: [
                    'Заказ услуг через Telegram',
                    'Отслеживание статуса заказов',
                    'Техническая поддержка 24/7',
                    'Система оплаты Telegram Stars'
                ],
                requirements: 'Telegram аккаунт',
                screenshots: ['/images/bot1.jpg', '/images/bot2.jpg'],
                download_url: 'https://t.me/rootzsu_bot'
            },
            {
                id: 6,
                title: 'File Manager Bot',
                description: 'Бот для управления файлами и облачным хранилищем',
                category: 'bots',
                icon: '📁',
                downloads: 1450,
                version: '1.3.0',
                size: 'Telegram Bot',
                features: [
                    'Загрузка и скачивание файлов',
                    'Организация файлов в папки',
                    'Поиск по файлам',
                    'Интеграция с облачными сервисами'
                ],
                requirements: 'Telegram аккаунт',
                screenshots: ['/images/filebot1.jpg', '/images/filebot2.jpg'],
                download_url: 'https://t.me/rootzsu_files_bot'
            }
        ];
    }

    switchCategory(category) {
        this.currentCategory = category;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        this.renderPrograms();
    }

    renderPrograms() {
        const grid = document.getElementById('programs-grid');
        const loading = document.getElementById('programs-loading');
        
        loading.style.display = 'flex';
        
        setTimeout(() => {
            const filteredPrograms = this.programs.filter(program => 
                program.category === this.currentCategory
            );
            
            grid.innerHTML = filteredPrograms.map(program => this.createProgramCard(program)).join('');
            
            // Bind click events to program cards
            grid.querySelectorAll('.program-card').forEach(card => {
                card.addEventListener('click', () => {
                    const programId = parseInt(card.dataset.programId);
                    this.showProgramDetails(programId);
                });
            });
            
            loading.style.display = 'none';
        }, 500);
    }

    createProgramCard(program) {
        const downloadText = program.category === 'bots' ? 'Открыть' : 'Скачать';
        const sizeText = program.category === 'bots' ? '' : `• ${program.size}`;
        
        return `
            <div class="program-card" data-program-id="${program.id}">
                <div class="program-icon">${program.icon}</div>
                <h3 class="program-title">${program.title}</h3>
                <p class="program-description">${program.description}</p>
                <div class="program-meta">
                    <span class="program-category">${this.getCategoryName(program.category)}</span>
                    <span class="program-downloads">${program.downloads} загрузок</span>
                </div>
                <div class="program-actions">
                    <a href="${program.download_url}" class="btn-download" target="_blank">
                        <i class="fa-solid fa-download"></i>
                        ${downloadText}
                    </a>
                    <button class="btn-info">
                        <i class="fa-solid fa-info-circle"></i>
                        Подробнее
                    </button>
                </div>
                <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
                    v${program.version} ${sizeText}
                </div>
            </div>
        `;
    }

    getCategoryName(category) {
        const names = {
            'pc': 'ПК',
            'tools': 'Инструменты',
            'bots': 'Боты'
        };
        return names[category] || category;
    }

    showProgramDetails(programId) {
        const program = this.programs.find(p => p.id === programId);
        if (!program) return;

        const modal = document.getElementById('program-modal');
        const details = document.getElementById('program-details');
        
        const downloadText = program.category === 'bots' ? 'Открыть бота' : 'Скачать программу';
        const sizeText = program.category === 'bots' ? '' : `<p><strong>Размер:</strong> ${program.size}</p>`;
        
        details.innerHTML = `
            <div class="program-icon">${program.icon}</div>
            <h2>${program.title}</h2>
            <p>${program.description}</p>
            
            <div class="program-info">
                <p><strong>Версия:</strong> ${program.version}</p>
                ${sizeText}
                <p><strong>Загрузок:</strong> ${program.downloads}</p>
                <p><strong>Категория:</strong> ${this.getCategoryName(program.category)}</p>
            </div>
            
            <div class="program-features">
                <h3>Возможности:</h3>
                <ul>
                    ${program.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
            
            <div class="program-requirements">
                <h4>Системные требования:</h4>
                <p>${program.requirements}</p>
            </div>
            
            <div class="program-actions" style="margin-top: 2rem;">
                <a href="${program.download_url}" class="btn-download" target="_blank">
                    <i class="fa-solid fa-download"></i>
                    ${downloadText}
                </a>
            </div>
        `;
        
        modal.classList.add('show');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProgramsManager();
});