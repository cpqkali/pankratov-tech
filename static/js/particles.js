// Enhanced Particle System for Phantom Services
class PhantomParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 100;
        this.mouse = { x: 0, y: 0 };
        this.theme = 'dark';
        this.isEnabled = localStorage.getItem('particles_enabled') !== 'false';
        
        if (!this.isEnabled) {
            this.canvas.style.display = 'none';
            return;
        }
        
        this.resize();
        this.init();
        this.bindEvents();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new PhantomParticle(this.canvas.width, this.canvas.height));
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
            this.createExplosion(e.clientX, e.clientY);
        });
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
        this.particles.forEach(particle => particle.updateTheme(theme));
    }
    
    toggle() {
        this.isEnabled = !this.isEnabled;
        localStorage.setItem('particles_enabled', this.isEnabled);
        
        if (this.isEnabled) {
            this.canvas.style.display = 'block';
            this.init();
        } else {
            this.canvas.style.display = 'none';
        }
    }
    
    animate() {
        if (!this.isEnabled) {
            requestAnimationFrame(() => this.animate());
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.update(this.mouse);
            particle.draw(this.ctx);
            return particle.life > 0;
        });
        
        // Add new particles if needed
        while (this.particles.length < this.particleCount) {
            this.particles.push(new PhantomParticle(this.canvas.width, this.canvas.height));
        }
        
        // Draw connections
        this.drawConnections();
        
        requestAnimationFrame(() => this.animate());
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

// Initialize particles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        window.phantomParticles = new PhantomParticleSystem(canvas);
    }
});