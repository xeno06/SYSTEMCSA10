// network-animation.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('networkCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Set actual canvas size and handle high-DPI
    function resizeCanvas() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Colors based on the design
    const colorPrimary = 'rgba(16, 185, 129, ';   // Neon Green
    const colorSecondary = 'rgba(94, 234, 212, '; // Teal/Cyan

    const particles = [];
    const particleCount = 40;
    const connectionDistance = 200;

    // Mouse Interaction
    let mouse = { x: null, y: null };
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    const icons = ['\uf07a', '\uf290', '\uf291', '\uf02b', '\uf02a', '\uf543', '\uf466', '\uf54f', '\uf0d6'];

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.4; // Slower, more elegant movement
            this.vy = (Math.random() - 0.5) * 0.4;
            this.icon = icons[Math.floor(Math.random() * icons.length)];
            this.size = Math.floor(Math.random() * 8) + 14;
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            this.x += this.vx;
            this.y += this.vy;
        }

        draw() {
            ctx.font = `900 ${this.size}px "Font Awesome 6 Free"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = colorPrimary + this.opacity + ')';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#10b981';
            ctx.fillText(this.icon, this.x, this.y);
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.shadowBlur = 0;

        // Draw background grid of subtle dots/circles
        const spacing = 60;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let x = 0; x < canvas.width; x += spacing) {
            for (let y = 0; y < canvas.height; y += spacing) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            ctx.shadowBlur = 0;
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    const opacity = (1 - (distance / connectionDistance)) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            if (mouse.x !== null) {
                const dxM = particles[i].x - mouse.x;
                const dyM = particles[i].y - mouse.y;
                const distanceM = Math.sqrt(dxM * dxM + dyM * dyM);
                if (distanceM < 200) {
                    const opacityM = (1 - (distanceM / 200)) * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = colorPrimary + opacityM + ')';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    animate();
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});
