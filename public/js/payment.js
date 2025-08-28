// Payment System
class PaymentSystem {
    constructor() {
        this.currentOrder = null;
        this.paymentMethods = {
            card: { name: 'Банковская карта', icon: 'fa-credit-card' },
            crypto: { name: 'Криптовалюта', icon: 'fa-bitcoin' },
            coins: { name: 'Монеты сайта', icon: 'fa-coins' }
        };
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
                        <div class="price-row coins-price">
                            <span><i class="fa-solid fa-coins"></i> Монеты:</span>
                            <span class="price">${this.currentOrder.priceCoins}</span>
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
            case 'card':
                formHTML = `
                    <div class="card-form">
                        <div class="form-group">
                            <label>Номер карты</label>
                            <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Срок действия</label>
                                <input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5">
                            </div>
                            <div class="form-group">
                                <label>CVV</label>
                                <input type="text" id="card-cvv" placeholder="123" maxlength="3">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Имя держателя</label>
                            <input type="text" id="card-holder" placeholder="IVAN PETROV">
                        </div>
                    </div>
                `;
                break;
                
            case 'crypto':
                formHTML = `
                    <div class="crypto-form">
                        <div class="crypto-options">
                            <button class="crypto-btn" data-crypto="btc">
                                <i class="fa-brands fa-bitcoin"></i>
                                Bitcoin
                            </button>
                            <button class="crypto-btn" data-crypto="eth">
                                <i class="fa-brands fa-ethereum"></i>
                                Ethereum
                            </button>
                            <button class="crypto-btn" data-crypto="usdt">
                                <i class="fa-solid fa-dollar-sign"></i>
                                USDT
                            </button>
                        </div>
                        <div class="crypto-address" id="crypto-address" style="display: none;">
                            <p>Переведите средства на адрес:</p>
                            <div class="address-container">
                                <input type="text" id="wallet-address" readonly>
                                <button class="btn secondary copy-btn" onclick="this.previousElementSibling.select(); document.execCommand('copy');">
                                    <i class="fa-solid fa-copy"></i>
                                </button>
                            </div>
                            <p class="crypto-note">После перевода прикрепите скриншот транзакции</p>
                            <input type="file" id="crypto-proof" accept="image/*">
                        </div>
                    </div>
                `;
                break;
                
            case 'coins':
                formHTML = `
                    <div class="coins-form">
                        <div class="coins-balance">
                            <i class="fa-solid fa-coins"></i>
                            <span>Ваш баланс: <strong id="user-coins">0</strong> монет</span>
                        </div>
                        <div class="coins-required">
                            <span>Требуется: <strong>${this.currentOrder.priceCoins}</strong> монет</span>
                        </div>
                        <div class="coins-actions">
                            <button class="btn secondary" onclick="window.location.href='#cabinet'">
                                Пополнить баланс
                            </button>
                        </div>
                    </div>
                `;
                break;
        }
        
        formContainer.innerHTML = formHTML;
        formContainer.style.display = 'block';
        payBtn.style.display = 'block';
        
        // Bind additional events
        if (method === 'card') {
            this.bindCardFormEvents(modal);
        } else if (method === 'crypto') {
            this.bindCryptoFormEvents(modal);
        } else if (method === 'coins') {
            this.loadUserCoins(modal);
        }
    }
    
    bindCardFormEvents(modal) {
        const cardNumber = modal.querySelector('#card-number');
        const cardExpiry = modal.querySelector('#card-expiry');
        
        // Format card number
        cardNumber.oninput = (e) => {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = formattedValue;
        };
        
        // Format expiry date
        cardExpiry.oninput = (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        };
    }
    
    bindCryptoFormEvents(modal) {
        const cryptoButtons = modal.querySelectorAll('.crypto-btn');
        const addressContainer = modal.querySelector('#crypto-address');
        const walletAddress = modal.querySelector('#wallet-address');
        
        const addresses = {
            btc: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            eth: '0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C',
            usdt: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'
        };
        
        cryptoButtons.forEach(btn => {
            btn.onclick = () => {
                cryptoButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const crypto = btn.dataset.crypto;
                walletAddress.value = addresses[crypto];
                addressContainer.style.display = 'block';
            };
        });
    }
    
    async loadUserCoins(modal) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.user_id) {
                const response = await fetch(`/api/user/${user.user_id}/coins`);
                const data = await response.json();
                modal.querySelector('#user-coins').textContent = data.coins || 0;
            }
        } catch (error) {
            console.error('Error loading user coins:', error);
        }
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
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...this.currentOrder,
                    payment_method: method,
                    payment_data: paymentData
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                modal.remove();
                this.showReceipt(result);
                this.showToast('Заказ успешно создан!', 'success');
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
            case 'card':
                data.cardNumber = modal.querySelector('#card-number').value;
                data.cardExpiry = modal.querySelector('#card-expiry').value;
                data.cardCvv = modal.querySelector('#card-cvv').value;
                data.cardHolder = modal.querySelector('#card-holder').value;
                break;
                
            case 'crypto':
                const activeCrypto = modal.querySelector('.crypto-btn.active');
                data.cryptoType = activeCrypto ? activeCrypto.dataset.crypto : null;
                data.walletAddress = modal.querySelector('#wallet-address').value;
                data.proofFile = modal.querySelector('#crypto-proof').files[0];
                break;
                
            case 'coins':
                data.coinsUsed = this.currentOrder.priceCoins;
                break;
        }
        
        return data;
    }
    
    validatePaymentData(data, method) {
        switch (method) {
            case 'card':
                if (!data.cardNumber || !data.cardExpiry || !data.cardCvv || !data.cardHolder) {
                    this.showToast('Заполните все поля карты', 'error');
                    return false;
                }
                break;
                
            case 'crypto':
                if (!data.cryptoType) {
                    this.showToast('Выберите криптовалюту', 'error');
                    return false;
                }
                break;
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

// Receipt System
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
                    <p>Email: support@rootzsu.com</p>
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
                <p>Статус: Оплачено</p>
                <p class="thank-you">Спасибо за ваш заказ!</p>
            </div>
        `;
    }
    
    formatPrice() {
        const method = this.orderData.payment_method;
        switch (method) {
            case 'usd': return `$${this.orderData.priceUsd}`;
            case 'eur': return `€${this.orderData.priceEur}`;
            case 'uah': return `₴${this.orderData.priceUah}`;
            case 'coins': return `${this.orderData.priceCoins} монет`;
            default: return `$${this.orderData.priceUsd}`;
        }
    }
    
    getPaymentMethodName() {
        const methods = {
            card: 'Банковская карта',
            crypto: 'Криптовалюта',
            coins: 'Монеты сайта'
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
Email: support@rootzsu.com

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
Статус: Оплачено

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
