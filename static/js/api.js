// Pankratov Tech - API Client

class APIClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('pankratov_token');
    }
    
    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        };
        
        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Network error' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
    
    // Authentication methods
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }
    
    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }
    
    async googleLogin(credential) {
        const response = await this.request('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential })
        });
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }
    
    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.clearToken();
        }
    }
    
    async getCurrentUser() {
        return await this.request('/auth/me');
    }
    
    // Services methods
    async getServices() {
        return await this.request('/services');
    }
    
    async getService(id) {
        return await this.request(`/services/${id}`);
    }
    
    // Programs methods
    async getPrograms() {
        return await this.request('/programs');
    }
    
    async getProgram(id) {
        return await this.request(`/programs/${id}`);
    }
    
    async downloadProgram(id) {
        const response = await fetch(`${this.baseURL}/api/programs/${id}/download`, {
            headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
        });
        
        if (!response.ok) {
            throw new Error('Download failed');
        }
        
        return response.blob();
    }
    
    // News methods
    async getNews() {
        return await this.request('/news');
    }
    
    async getNewsItem(id) {
        return await this.request(`/news/${id}`);
    }
    
    // Orders methods
    async createOrder(orderData) {
        const formData = new FormData();
        
        // Add order data
        Object.keys(orderData).forEach(key => {
            if (key === 'payment_proof' && orderData[key] instanceof File) {
                formData.append(key, orderData[key]);
            } else {
                formData.append(key, JSON.stringify(orderData[key]));
            }
        });
        
        return await this.request('/orders', {
            method: 'POST',
            headers: {
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            body: formData
        });
    }
    
    async getOrders() {
        return await this.request('/orders');
    }
    
    async getOrder(id) {
        return await this.request(`/orders/${id}`);
    }
    
    async cancelOrder(id) {
        return await this.request(`/orders/${id}/cancel`, {
            method: 'POST'
        });
    }
    
    // User methods
    async updateProfile(userData) {
        return await this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }
    
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        
        return await this.request('/user/avatar', {
            method: 'POST',
            headers: {
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            body: formData
        });
    }
    
    // Admin methods
    async getAdminStats() {
        return await this.request('/admin/stats');
    }
    
    async getAllUsers() {
        return await this.request('/admin/users');
    }
    
    async getAllOrders() {
        return await this.request('/admin/orders');
    }
    
    async approveOrder(orderId) {
        return await this.request(`/admin/orders/${orderId}/approve`, {
            method: 'POST'
        });
    }
    
    async rejectOrder(orderId, reason = '') {
        return await this.request(`/admin/orders/${orderId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }
    
    async createProgram(programData) {
        const formData = new FormData();
        
        Object.keys(programData).forEach(key => {
            if (programData[key] instanceof File) {
                formData.append(key, programData[key]);
            } else {
                formData.append(key, JSON.stringify(programData[key]));
            }
        });
        
        return await this.request('/admin/programs', {
            method: 'POST',
            headers: {
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            body: formData
        });
    }
    
    async updateProgram(id, programData) {
        return await this.request(`/admin/programs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(programData)
        });
    }
    
    async deleteProgram(id) {
        return await this.request(`/admin/programs/${id}`, {
            method: 'DELETE'
        });
    }
    
    async createNews(newsData) {
        return await this.request('/admin/news', {
            method: 'POST',
            body: JSON.stringify(newsData)
        });
    }
    
    async updateNews(id, newsData) {
        return await this.request(`/admin/news/${id}`, {
            method: 'PUT',
            body: JSON.stringify(newsData)
        });
    }
    
    async deleteNews(id) {
        return await this.request(`/admin/news/${id}`, {
            method: 'DELETE'
        });
    }
    
    // Token management
    setToken(token) {
        this.token = token;
        localStorage.setItem('pankratov_token', token);
    }
    
    clearToken() {
        this.token = null;
        localStorage.removeItem('pankratov_token');
    }
    
    hasToken() {
        return !!this.token;
    }
}

// Create global API client instance
const api = new APIClient();

// Export for use in other modules
window.api = api;