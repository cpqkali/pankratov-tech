// Enhanced Particle System for Phantom Services with Performance Options
class PhantomParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.theme = 'dark';
        
        // Performance settings
        this.settings = this.loadSettings();
        this.animationId = null;
        
        if (!this.settings.enabled) {
            this.canvas.style.display = 'none';
            return;
        }
        
        this.resize();
        this.init();
        this.bindEvents();
        this.animate();
    }
    
    loadSettings() {
        const defaultSettings = {
            enabled: true,
            animationType: 'particles', // 'particles', 'waves', 'geometric'
            particleCount: 100,
            performance: 'high' // 'high', 'medium', 'low'
        };
        
        const saved = localStorage.getItem('phantom_particle_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }
    
    saveSettings() {
        localStorage.setItem('phantom_particle_settings', JSON.stringify(this.settings));
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        
        if (!this.settings.enabled) {
            this.stop();
            this.canvas.style.display = 'none';
            return;
        }
        
        this.canvas.style.display = 'block';
        this.init();
        if (!this.animationId) {
            this.animate();
        }
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.particles = [];
        
        // Adjust particle count based on performance setting
        let count = this.settings.particleCount;
        if (this.settings.performance === 'medium') count *= 0.7;
        if (this.settings.performance === 'low') count *= 0.4;
        
        switch (this.settings.animationType) {
            case 'particles':
                this.initParticles(count);
                break;
            case 'waves':
                this.initWaves();
                break;
            case 'geometric':
                this.initGeometric();
                break;
        }
    }
    
    initParticles(count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new PhantomParticle(this.canvas.width, this.canvas.height));
        }
    }
    
    initWaves() {
        this.waveOffset = 0;
        this.waves = [];
        for (let i = 0; i < 3; i++) {
            this.waves.push({
                amplitude: 50 + i * 20,
                frequency: 0.01 + i * 0.005,
                phase: i * Math.PI / 3,
                speed: 0.02 + i * 0.01,
                opacity: 0.3 - i * 0.1
            });
        }
    }
    
    initGeometric() {
        this.geometricShapes = [];
        for (let i = 0; i < 20; i++) {
            this.geometricShapes.push(new GeometricShape(this.canvas.width, this.canvas.height));
        }
    }
    
    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.init();
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        window.addEventListener('click', (e) => {
            if (this.settings.animationType === 'particles') {
                this.createExplosion(e.clientX, e.clientY);
            }
        });
        
        // Performance monitoring
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
            const particle = new PhantomParticle(this.canvas.width, this.canvas.height);
            particle.x = x;
            particle.y = y;
            particle.vx = (Math.random() - 0.5) * 10;
            particle.vy = (Math.random() - 0.5) * 10;
            particle.life = 60;
            particle.maxLife = 60;
            this.particles.push(particle);
        }
    }
    
    updateTheme(theme) {
        this.theme = theme;
        if (this.particles) {
            this.particles.forEach(particle => particle.updateTheme(theme));
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        if (!this.settings.enabled) return;
        
        // Performance monitoring
        const currentTime = performance.now();
        this.frameCount++;
        
        if (currentTime - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
            
            // Auto-adjust performance if FPS is too low
            if (this.fps < 30 && this.settings.performance === 'high') {
                this.updateSettings({ performance: 'medium' });
            } else if (this.fps < 20 && this.settings.performance === 'medium') {
                this.updateSettings({ performance: 'low' });
            }
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        switch (this.settings.animationType) {
            case 'particles':
                this.animateParticles();
                break;
            case 'waves':
                this.animateWaves();
                break;
            case 'geometric':
                this.animateGeometric();
                break;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    animateParticles() {
        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.update(this.mouse);
            particle.draw(this.ctx);
            return particle.life !== 0;
        });
        
        // Add new particles if needed
        const targetCount = this.getTargetParticleCount();
        while (this.particles.length < targetCount) {
            this.particles.push(new PhantomParticle(this.canvas.width, this.canvas.height));
        }
        
        // Draw connections only on high performance
        if (this.settings.performance === 'high') {
            this.drawConnections();
        }
    }
    
    animateWaves() {
        this.waveOffset += 0.02;
        
        this.waves.forEach(wave => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.getWaveColor(wave.opacity);
            this.ctx.lineWidth = 2;
            
            for (let x = 0; x <= this.canvas.width; x += 5) {
                const y = this.canvas.height / 2 + 
                         Math.sin(x * wave.frequency + this.waveOffset + wave.phase) * wave.amplitude;
                
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        });
    }
    
    animateGeometric() {
        this.geometricShapes.forEach(shape => {
            shape.update();
            shape.draw(this.ctx, this.theme);
        });
    }
    
    getTargetParticleCount() {
        let count = this.settings.particleCount;
        if (this.settings.performance === 'medium') count *= 0.7;
        if (this.settings.performance === 'low') count *= 0.4;
        return Math.floor(count);
    }
    
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    const opacity = (150 - distance) / 150 * 0.3;
                    this.ctx.strokeStyle = this.getConnectionColor(opacity);
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    getConnectionColor(opacity) {
        const colors = {
            dark: `rgba(139, 92, 246, ${opacity})`,
            light: `rgba(99, 102, 241, ${opacity})`
        };
        return colors[this.theme] || colors.dark;
    }
    
    getWaveColor(opacity) {
        const colors = {
            dark: `rgba(139, 92, 246, ${opacity})`,
            light: `rgba(99, 102, 241, ${opacity})`
        };
        return colors[this.theme] || colors.dark;
    }
}

class PhantomParticle {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = Math.random() * 3 + 1;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.theme = 'dark';
        this.originalRadius = this.radius;
        this.life = -1; // Infinite life by default
        this.maxLife = -1;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }
    
    update(mouse) {
        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
            const force = (120 - distance) / 120;
            this.vx -= (dx / distance) * force * 0.02;
            this.vy -= (dy / distance) * force * 0.02;
            this.radius = this.originalRadius + force * 3;
        } else {
            this.radius = this.originalRadius;
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary collision with bounce
        if (this.x < 0 || this.x > this.canvasWidth) {
            this.vx *= -0.8;
            this.x = Math.max(0, Math.min(this.canvasWidth, this.x));
        }
        if (this.y < 0 || this.y > this.canvasHeight) {
            this.vy *= -0.8;
            this.y = Math.max(0, Math.min(this.canvasHeight, this.y));
        }
        
        // Add some randomness and drift
        this.vx += (Math.random() - 0.5) * 0.02;
        this.vy += (Math.random() - 0.5) * 0.02;
        
        // Limit velocity
        this.vx = Math.max(-3, Math.min(3, this.vx));
        this.vy = Math.max(-3, Math.min(3, this.vy));
        
        // Apply friction
        this.vx *= 0.99;
        this.vy *= 0.99;
        
        // Update life for explosion particles
        if (this.life > 0) {
            this.life--;
            this.opacity = this.life / this.maxLife;
        } else {
            // Pulse effect for normal particles
            this.pulsePhase += this.pulseSpeed;
            this.opacity = 0.3 + Math.sin(this.pulsePhase) * 0.2;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.getParticleColor();
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.getParticleColor();
        ctx.fill();
        
        ctx.restore();
    }
    
    updateTheme(theme) {
        this.theme = theme;
    }
    
    getParticleColor() {
        const colors = {
            dark: '#8b5cf6',
            light: '#6366f1'
        };
        return colors[this.theme] || colors.dark;
    }
}

class GeometricShape {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 50 + 20;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.shape = Math.floor(Math.random() * 3); // 0: triangle, 1: square, 2: hexagon
        this.opacity = Math.random() * 0.3 + 0.1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        
        // Wrap around screen
        if (this.x < -this.size) this.x = this.canvasWidth + this.size;
        if (this.x > this.canvasWidth + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = this.canvasHeight + this.size;
        if (this.y > this.canvasHeight + this.size) this.y = -this.size;
    }
    
    draw(ctx, theme) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;
        
        const color = theme === 'dark' ? '#8b5cf6' : '#6366f1';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        
        switch (this.shape) {
            case 0: // Triangle
                ctx.moveTo(0, -this.size / 2);
                ctx.lineTo(-this.size / 2, this.size / 2);
                ctx.lineTo(this.size / 2, this.size / 2);
                ctx.closePath();
                break;
            case 1: // Square
                ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
                break;
            case 2: // Hexagon
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const x = Math.cos(angle) * this.size / 2;
                    const y = Math.sin(angle) * this.size / 2;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
        }
        
        ctx.stroke();
        ctx.restore();
    }
}

// Particle Control Panel
class ParticleControlPanel {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.createPanel();
    }
    
    createPanel() {
        // Create control panel HTML
        const panel = document.createElement('div');
        panel.id = 'particle-control-panel';
        panel.className = 'particle-control-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h4>Настройки анимации</h4>
                <button class="panel-toggle" onclick="particleControlPanel.toggle()">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
            <div class="panel-content">
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="particles-enabled" ${this.particleSystem.settings.enabled ? 'checked' : ''}>
                        Включить анимацию
                    </label>
                </div>
                
                <div class="control-group">
                    <label>Тип анимации:</label>
                    <select id="animation-type">
                        <option value="particles" ${this.particleSystem.settings.animationType === 'particles' ? 'selected' : ''}>Частицы</option>
                        <option value="waves" ${this.particleSystem.settings.animationType === 'waves' ? 'selected' : ''}>Волны</option>
                        <option value="geometric" ${this.particleSystem.settings.animationType === 'geometric' ? 'selected' : ''}>Геометрия</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <label>Производительность:</label>
                    <select id="performance-level">
                        <option value="high" ${this.particleSystem.settings.performance === 'high' ? 'selected' : ''}>Высокая</option>
                        <option value="medium" ${this.particleSystem.settings.performance === 'medium' ? 'selected' : ''}>Средняя</option>
                        <option value="low" ${this.particleSystem.settings.performance === 'low' ? 'selected' : ''}>Низкая</option>
                    </select>
                </div>
                
                <div class="control-group" id="particle-count-group">
                    <label>Количество частиц: <span id="particle-count-value">${this.particleSystem.settings.particleCount}</span></label>
                    <input type="range" id="particle-count" min="20" max="200" value="${this.particleSystem.settings.particleCount}">
                </div>
                
                <div class="control-group">
                    <div class="fps-display">FPS: <span id="fps-counter">60</span></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.bindEvents();
        
        // Update FPS counter
        setInterval(() => {
            document.getElementById('fps-counter').textContent = this.particleSystem.fps || 60;
        }, 1000);
    }
    
    bindEvents() {
        document.getElementById('particles-enabled').addEventListener('change', (e) => {
            this.particleSystem.updateSettings({ enabled: e.target.checked });
        });
        
        document.getElementById('animation-type').addEventListener('change', (e) => {
            this.particleSystem.updateSettings({ animationType: e.target.value });
            this.updateVisibility();
        });
        
        document.getElementById('performance-level').addEventListener('change', (e) => {
            this.particleSystem.updateSettings({ performance: e.target.value });
        });
        
        document.getElementById('particle-count').addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            document.getElementById('particle-count-value').textContent = count;
            this.particleSystem.updateSettings({ particleCount: count });
        });
    }
    
    updateVisibility() {
        const animationType = document.getElementById('animation-type').value;
        const particleCountGroup = document.getElementById('particle-count-group');
        particleCountGroup.style.display = animationType === 'particles' ? 'block' : 'none';
    }
    
    toggle() {
        const panel = document.getElementById('particle-control-panel');
        panel.classList.toggle('open');
    }
}

// Initialize particles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        window.phantomParticles = new PhantomParticleSystem(canvas);
        window.particleControlPanel = new ParticleControlPanel(window.phantomParticles);
    }
});