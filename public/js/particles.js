// Enhanced Particle System
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 80;
        this.mouse = { x: 0, y: 0 };
        this.theme = 'dark';
        
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
            this.particles.push(new Particle(this.canvas.width, this.canvas.height));
        }
    }
    
    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    updateTheme(theme) {
        this.theme = theme;
        this.particles.forEach(particle => particle.updateTheme(theme));
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles.forEach(particle => {
            particle.update(this.mouse);
            particle.draw(this.ctx);
        });
        
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
                
                if (distance < 120) {
                    const opacity = (120 - distance) / 120 * 0.3;
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
            dark: `rgba(0, 224, 255, ${opacity})`,
            light: `rgba(0, 122, 255, ${opacity})`,
            cyberpunk: `rgba(247, 255, 0, ${opacity})`,
            matrix: `rgba(0, 255, 0, ${opacity})`,
            aqua: `rgba(0, 242, 255, ${opacity})`,
            hyprland: `rgba(187, 154, 247, ${opacity})`
        };
        return colors[this.theme] || colors.dark;
    }
}

class Particle {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.theme = 'dark';
        this.originalRadius = this.radius;
    }
    
    update(mouse) {
        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
            const force = (100 - distance) / 100;
            this.vx -= (dx / distance) * force * 0.01;
            this.vy -= (dy / distance) * force * 0.01;
            this.radius = this.originalRadius + force * 2;
        } else {
            this.radius = this.originalRadius;
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary collision
        if (this.x < 0 || this.x > this.canvasWidth) this.vx *= -1;
        if (this.y < 0 || this.y > this.canvasHeight) this.vy *= -1;
        
        // Keep in bounds
        this.x = Math.max(0, Math.min(this.canvasWidth, this.x));
        this.y = Math.max(0, Math.min(this.canvasHeight, this.y));
        
        // Add some randomness
        this.vx += (Math.random() - 0.5) * 0.01;
        this.vy += (Math.random() - 0.5) * 0.01;
        
        // Limit velocity
        this.vx = Math.max(-2, Math.min(2, this.vx));
        this.vy = Math.max(-2, Math.min(2, this.vy));
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.getParticleColor();
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.getParticleColor();
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    updateTheme(theme) {
        this.theme = theme;
    }
    
    getParticleColor() {
        const colors = {
            dark: '#00e0ff',
            light: '#007aff',
            cyberpunk: '#f7ff00',
            matrix: '#00ff00',
            aqua: '#00f2ff',
            hyprland: '#bb9af7'
        };
        return colors[this.theme] || colors.dark;
    }
}

// Initialize particles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particle-canvas');
    if (canvas && typeof ParticleSystem !== 'undefined') {
        window.particleSystem = new ParticleSystem(canvas);
    } else if (!canvas) {
        console.warn('Particle canvas not found');
    } else {
        console.warn('ParticleSystem class not defined');
    }
});
