// Enhanced Payment System with TG Stars and Ukraine Card Support
class PaymentSystem {
    constructor() {
        this.currentOrder = null;
        this.paymentMethods = {
            card_ukraine: { name: 'Перевод на карту (Украина)', icon: 'fa-credit-card' },
            crypto: { name: 'Криптовалюта (TON)', icon: 'fa-coins' },
            stars: { name: 'Telegram Stars', icon: 'fa-star' }
        };
        this.ukraineCard = '4149 6090 1876 9549'; // PrivatBank card
    }
    
    async processPayment(orderData) {
        this.currentOrder = orderData;
        this.showPaymentModal();
    }
    
    showPaymentModal() {
        const modal = this.createPaymentModal();
        document.body.appendChild(modal);
        modal.classList.add('show');
    }
    
    createPaymentModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-container payment-modal';
        modal.innerHTML = `
            <div class="modal-content glass">
                <button class="modal-close-btn">&times;</button>
                <h2><i class="fa-solid fa-credit-card"></i> ${t('payment_title')}</h2>
                
                <div class="payment-info">
                    <div class="service-info">
                        <h3>${this.currentOrder.serviceName}</h3>
                        <p class="service-description">${this.currentOrder.serviceDescription}</p>
                    </div>
                    
                    <div class="price-info">
                        <div class="price-row">
                            <span>USD:</span>
                            <span class="price">$${this.currentOrder.priceUsd}</span>
                        </div>
                        <div class="price-row">
                            <span>EUR:</span>
                            <span class="price">€${this.currentOrder.priceEur}</span>
                        </div>
                        <div class="price-row">
                            <span>UAH:</span>
                            <span class="price">₴${this.currentOrder.priceUah}</span>
                        </div>
                        <div class="price-row stars-price">
                            <span><i class="fa-solid fa-star"></i> Telegram Stars:</span>
                            <span class="price">${this.currentOrder.priceStars}</span>
                        </div>
                    </div>
                </div>
                
                <div class="payment-methods">
                    <h3>${t('payment_method')}</h3>
                    <div class="method-buttons">
                        ${Object.entries(this.paymentMethods).map(([key, method]) => `
                            <button class="payment-method-btn" data-method="${key}">
                                <i class="fa-solid ${method.icon}"></i>
                                <span>${method.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="payment-form" id="payment-form" style="display: none;">
                    <!-- Payment form will be inserted here -->
                </div>
                
                <div class="payment-actions">
                    <button class="btn secondary" onclick="this.closest('.modal-container').remove()">
                        ${t('cancel')}
                    </button>
                    <button class="btn primary" id="pay-btn" style="display: none;">
                        <i class="fa-solid fa-credit-card"></i>
                        ${t('pay_now')}
                    </button>
                </div>
            </div>
        `;
        
        this.bindPaymentEvents(modal);
        return modal;
    }
    
    bindPaymentEvents(modal) {
        // Close modal
        modal.querySelector('.modal-close-btn').onclick = () => modal.remove();
        
        // Payment method selection
        modal.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.onclick = () => {
                modal.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const method = btn.dataset.method;
                this.showPaymentForm(modal, method);
            };
        });
        
        // Pay button
        modal.querySelector('#pay-btn').onclick = () => this.submitPayment(modal);
    }
    
    showPaymentForm(modal, method) {
        const formContainer = modal.querySelector('#payment-form');
        const payBtn = modal.querySelector('#pay-btn');
        
        let formHTML = '';
        
        switch (method) {
            case 'card_ukraine':
                formHTML = `
                    <div class="card-ukraine-form">
                        <div class="card-info">
                            <h4>Реквизиты для перевода:</h4>
                            <div class="card-details">
                                <div class="card-number">
                                    <label>Номер карты ПриватБанк:</label>
                                    <div class="copy-field">
                                        <input type="text" value="${this.ukraineCard}" readonly>
                                        <button class="btn secondary copy-btn" onclick="this.previousElementSibling.select(); document.execCommand('copy'); this.textContent='Скопировано!';">
                                            <i class="fa-solid fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="amount-info">
                                    <p><strong>Сумма к переводу:</strong> ${this.currentOrder.priceUah} UAH</p>
                                </div>
                            </div>
                        </div>
                        <div class="upload-section">
                            <h4>Загрузите скриншот перевода:</h4>
                            <input type="file" id="payment-screenshot" accept="image/*" required>
                            <p class="upload-note">После перевода загрузите скриншот для подтверждения оплаты</p>
                        </div>
                    </div>
                `;
                break;
                
            case 'crypto':
                formHTML = `
                    <div class="crypto-form">
                        <div class="crypto-info">
                            <h4>Оплата TON:</h4>
                            <div class="ton-address">
                                <label>TON адрес:</label>
                                <div class="copy-field">
                                    <input type="text" value="UQCKtm0RoDtPCyObq18G-FKehsDPaVIiVX5Z8q78P_XfmTUh" readonly>
                                    <button class="btn secondary copy-btn" onclick="this.previousElementSibling.select(); document.execCommand('copy'); this.textContent='Скопировано!';">
                                        <i class="fa-solid fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="amount-info">
                                <p><strong>Сумма к переводу:</strong> ${this.currentOrder.priceUsd} USD в TON</p>
                            </div>
                        </div>
                        <div class="upload-section">
                            <h4>Загрузите скриншот транзакции:</h4>
                            <input type="file" id="crypto-screenshot" accept="image/*" required>
                            <p class="upload-note">После перевода загрузите скриншот транзакции</p>
                        </div>
                    </div>
                `;
                break;
                
            case 'stars':
                formHTML = `
                    <div class="stars-form">
                        <div class="stars-info">
                            <h4>Оплата Telegram Stars:</h4>
                            <div class="stars-amount">
                                <p><strong>Стоимость:</strong> ${this.currentOrder.priceStars} ⭐</p>
                            </div>
                            <div class="stars-instructions">
                                <p>Для оплаты Telegram Stars:</p>
                                <ol>
                                    <li>Перейдите в Telegram бот @rootzsu_bot</li>
                                    <li>Выберите услугу и оплатите звездами</li>
                                    <li>Загрузите скриншот подтверждения</li>
                                </ol>
                            </div>
                        </div>
                        <div class="upload-section">
                            <h4>Загрузите скриншот оплаты:</h4>
                            <input type="file" id="stars-screenshot" accept="image/*" required>
                            <p class="upload-note">Загрузите скриншот подтверждения оплаты звездами</p>
                        </div>
                    </div>
                `;
                break;
        }
        
        formContainer.innerHTML = formHTML;
        formContainer.style.display = 'block';
        payBtn.style.display = 'block';
    }
    
    async submitPayment(modal) {
        const activeMethod = modal.querySelector('.payment-method-btn.active');
        if (!activeMethod) {
            this.showToast('Выберите способ оплаты', 'error');
            return;
        }
        
        const method = activeMethod.dataset.method;
        const paymentData = this.collectPaymentData(modal, method);
        
        if (!this.validatePaymentData(paymentData, method)) {
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('user_id', this.currentOrder.userId);
            formData.append('service_id', this.currentOrder.serviceId);
            formData.append('payment_method', method);
            formData.append('order_details', JSON.stringify(paymentData));
            
            // Add screenshot if provided
            if (paymentData.screenshot) {
                formData.append('payment_screenshot', paymentData.screenshot);
            }
            
            const response = await fetch('/api/orders', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                modal.remove();
                this.showReceipt(result);
                this.showToast('Заказ успешно создан! Ожидайте подтверждения оплаты.', 'success');
            } else {
                this.showToast(result.error || 'Ошибка при создании заказа', 'error');
            }
        } catch (error) {
            console.error('Payment error:', error);
            this.showToast('Ошибка при обработке платежа', 'error');
        }
    }
    
    collectPaymentData(modal, method) {
        const data = { method };
        
        switch (method) {
            case 'card_ukraine':
                data.cardNumber = this.ukraineCard;
                data.amount = this.currentOrder.priceUah;
                data.currency = 'UAH';
                data.screenshot = modal.querySelector('#payment-screenshot').files[0];
                break;
                
            case 'crypto':
                data.cryptoType = 'TON';
                data.address = 'UQCKtm0RoDtPCyObq18G-FKehsDPaVIiVX5Z8q78P_XfmTUh';
                data.amount = this.currentOrder.priceUsd;
                data.currency = 'USD';
                data.screenshot = modal.querySelector('#crypto-screenshot').files[0];
                break;
                
            case 'stars':
                data.starsAmount = this.currentOrder.priceStars;
                data.screenshot = modal.querySelector('#stars-screenshot').files[0];
                break;
        }
        
        return data;
    }
    
    validatePaymentData(data, method) {
        if (!data.screenshot) {
            this.showToast('Загрузите скриншот подтверждения оплаты', 'error');
            return false;
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(data.screenshot.type)) {
            this.showToast('Загрузите изображение в формате JPG, PNG или GIF', 'error');
            return false;
        }
        
        // Validate file size (max 5MB)
        if (data.screenshot.size > 5 * 1024 * 1024) {
            this.showToast('Размер файла не должен превышать 5MB', 'error');
            return false;
        }
        
        return true;
    }
    
    showReceipt(orderData) {
        const receipt = new Receipt(orderData);
        receipt.show();
    }
    
    showToast(message, type = 'info') {
        // Implementation from main script
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`Toast: ${message} (${type})`);
        }
    }
}

// Enhanced Receipt System
class Receipt {
    constructor(orderData) {
        this.orderData = orderData;
        this.receiptId = `RCP-${Date.now()}`;
    }
    
    show() {
        const modal = this.createReceiptModal();
        document.body.appendChild(modal);
        modal.classList.add('show');
    }
    
    createReceiptModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-container receipt-modal';
        modal.innerHTML = `
            <div class="modal-content glass">
                <button class="modal-close-btn">&times;</button>
                <h2><i class="fa-solid fa-receipt"></i> ${t('receipt_title')}</h2>
                
                <div class="receipt-content" id="receipt-content">
                    ${this.generateReceiptHTML()}
                </div>
                
                <div class="receipt-actions">
                    <button class="btn secondary" onclick="this.closest('.modal-container').remove()">
                        ${t('close')}
                    </button>
                    <button class="btn primary" onclick="window.receiptInstance.downloadHTML()">
                        <i class="fa-solid fa-download"></i>
                        ${t('receipt_download_html')}
                    </button>
                    <button class="btn primary" onclick="window.receiptInstance.downloadTXT()">
                        <i class="fa-solid fa-file-text"></i>
                        ${t('receipt_download_txt')}
                    </button>
                </div>
            </div>
        `;
        
        modal.querySelector('.modal-close-btn').onclick = () => modal.remove();
        window.receiptInstance = this;
        
        return modal;
    }
    
    generateReceiptHTML() {
        const date = new Date().toLocaleString();
        return `
            <div class="receipt-header">
                <div class="company-info">
                    <h3>ROOTZSU SERVICES</h3>
                    <p>Профессиональные IT-услуги</p>
                    <p>Telegram: @rootzsu</p>
                    <p>GitHub: github.com/cpqkali</p>
                </div>
                <div class="receipt-info">
                    <p><strong>Чек №:</strong> ${this.receiptId}</p>
                    <p><strong>Дата:</strong> ${date}</p>
                    <p><strong>Заказ №:</strong> ${this.orderData.order_id}</p>
                </div>
            </div>
            
            <div class="receipt-details">
                <table class="receipt-table">
                    <thead>
                        <tr>
                            <th>Услуга</th>
                            <th>Количество</th>
                            <th>Цена</th>
                            <th>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${this.orderData.serviceName}</td>
                            <td>1</td>
                            <td>${this.formatPrice()}</td>
                            <td>${this.formatPrice()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="receipt-summary">
                <div class="summary-row">
                    <span>Подытог:</span>
                    <span>${this.formatPrice()}</span>
                </div>
                <div class="summary-row">
                    <span>НДС (0%):</span>
                    <span>$0.00</span>
                </div>
                <div class="summary-row total">
                    <span><strong>Итого:</strong></span>
                    <span><strong>${this.formatPrice()}</strong></span>
                </div>
            </div>
            
            <div class="receipt-footer">
                <p>Способ оплаты: ${this.getPaymentMethodName()}</p>
                <p>Статус: ${t('payment_pending')}</p>
                <p class="thank-you">Спасибо за ваш заказ!</p>
            </div>
        `;
    }
    
    formatPrice() {
        const method = this.orderData.payment_method;
        switch (method) {
            case 'card_ukraine': return `₴${this.orderData.priceUah}`;
            case 'crypto': return `$${this.orderData.priceUsd}`;
            case 'stars': return `${this.orderData.priceStars} ⭐`;
            default: return `$${this.orderData.priceUsd}`;
        }
    }
    
    getPaymentMethodName() {
        const methods = {
            card_ukraine: 'Перевод на карту (Украина)',
            crypto: 'Криптовалюта (TON)',
            stars: 'Telegram Stars'
        };
        return methods[this.orderData.payment_method] || 'Неизвестно';
    }
    
    downloadHTML() {
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Чек ${this.receiptId}</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    .receipt-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .receipt-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .receipt-table th, .receipt-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    .receipt-table th { background-color: #f5f5f5; }
                    .receipt-summary { margin-top: 20px; }
                    .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; }
                    .receipt-footer { margin-top: 30px; text-align: center; }
                    .thank-you { font-size: 18px; color: #007aff; margin-top: 20px; }
                </style>
            </head>
            <body>
                ${this.generateReceiptHTML()}
            </body>
            </html>
        `;
        
        this.downloadFile(content, `receipt-${this.receiptId}.html`, 'text/html');
    }
    
    downloadTXT() {
        const content = `
ROOTZSU SERVICES
Профессиональные IT-услуги
Telegram: @rootzsu
GitHub: github.com/cpqkali

========================================
ЧЕК № ${this.receiptId}
========================================

Дата: ${new Date().toLocaleString()}
Заказ №: ${this.orderData.order_id}

Услуга: ${this.orderData.serviceName}
Количество: 1
Цена: ${this.formatPrice()}
Сумма: ${this.formatPrice()}

----------------------------------------
Подытог: ${this.formatPrice()}
НДС (0%): $0.00
ИТОГО: ${this.formatPrice()}
----------------------------------------

Способ оплаты: ${this.getPaymentMethodName()}
Статус: ${t('payment_pending')}

Спасибо за ваш заказ!

========================================
        `;
        
        this.downloadFile(content, `receipt-${this.receiptId}.txt`, 'text/plain');
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize payment system
document.addEventListener('DOMContentLoaded', () => {
    window.paymentSystem = new PaymentSystem();
});