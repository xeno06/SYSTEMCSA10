import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../index.css';

export default function Landing() {
    const canvasRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Refined lattice animation
        const colorPrimary = 'rgba(16, 185, 129, ';   // Neon Green
        const particles = [];
        const particleCount = 40;
        const connectionDistance = 200;
        let mouse = { x: null, y: null };

        const icons = ['\uf07a', '\uf290', '\uf291', '\uf02b', '\uf02a', '\uf543', '\uf466', '\uf54f', '\uf0d6'];

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.4;
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

        for (let i = 0; i < particleCount; i++) particles.push(new Particle());

        const onMove = (e) => {
            const r = canvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
        };
        const onLeave = () => { mouse.x = null; mouse.y = null; };
        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseleave', onLeave);

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.shadowBlur = 0;

            // Background lattice dots
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
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < connectionDistance) {
                        const op = (1 - dist / connectionDistance) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(16, 185, 129, ${op})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                if (mouse.x !== null) {
                    const dx = particles[i].x - mouse.x, dy = particles[i].y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) {
                        const opM = (1 - dist / 200) * 0.4;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = colorPrimary + opM + ')';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        }

        animate();

        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousemove', onMove);
            canvas.removeEventListener('mouseleave', onLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            {/* ── NAVBAR ─────────────────────────────────── */}
            <nav className={scrolled ? 'scrolled' : ''}>
                <div className="logo">
                    <Link to="/">CoBuy</Link>
                </div>
                <div className="nav-right">
                    <div className="nav-links">
                        <a href="#hero" onClick={(e) => {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            window.history.pushState(null, '', '/');
                        }}>Home</a>
                        <a href="#features">Features</a>
                        <a href="#about">About</a>
                        <a href="#contact">Contacts</a>
                        <a href="#faq">FAQs</a>
                    </div>
                    <div className="nav-actions">
                        <Link to="/auth" className="btn-nav btn-login">Login</Link>
                        <Link to="/auth?register=true" className="btn-nav btn-signup">Sign Up</Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ───────────────────────────────────── */}
            <section className="hero" id="hero">
                <canvas className="hero-canvas-bg" ref={canvasRef} id="networkCanvas"></canvas>
                <div className="hero-container">
                    <div className="hero-text">
                        <div className="hero-badge">Industrial-Grade Market Intelligence</div>
                        <h1 className="hero-title">
                            Unlock the Power of <br />
                            <span className="text-gradient-green">Consumer Patterns.</span>
                        </h1>
                        <p className="hero-subtitle">
                            Transform raw transaction data into actionable business intelligence. Discover hidden purchasing affinities, optimize your inventory, and drive revenue with research-aligned data mining.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/auth?register=true" className="btn btn-primary btn-lg">
                                Get Started Free <i className="fas fa-arrow-right"></i>
                            </Link>
                            <Link to="/auth" className="btn btn-outline btn-lg">
                                Dashboard Access
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ─────────────────────────────── */}
            <section className="features-section" id="features">
                <div className="section-header">
                    <h2 className="section-title">Revolutionary Features</h2>
                    <p className="section-subtitle">
                        CoBuy provides the ultimate toolkit for market basket analysis and consumer behavior modeling.
                    </p>
                </div>

                <div className="feature-grid">
                    {[
                        {
                            icon: 'fa-chart-pie',
                            title: 'Best-Seller Analytics',
                            desc: 'Identify high-velocity inventory at a glance. Understand what drives your baseline revenue with real-time sales volume tracking.',
                        },
                        {
                            icon: 'fa-project-diagram',
                            title: 'Association Mining',
                            desc: 'Leverage the FP-Growth algorithm to uncover products frequently bought together. Create data-backed bundles and layouts.',
                        },
                        {
                            icon: 'fa-history',
                            title: 'Strategic Auditing',
                            desc: 'Maintain a comprehensive digital footprint of every transactional interaction to audit growth and historical performance.',
                        }
                    ].map(({ icon, title, desc }) => (
                        <div className="feature-card" key={title}>
                            <div className="feature-icon-container">
                                <i className={`fas ${icon}`}></i>
                            </div>
                            <h3 className="feature-card-title">{title}</h3>
                            <p className="feature-card-desc">{desc}</p>
                            <div className="feature-card-glass"></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── ABOUT ─────────────────────────── */}
            <section className="about-section" id="about">
                <div className="section-header">
                    <h2 className="section-title">About CoBuy</h2>
                </div>
                <div className="about-content">
                    <p>
                        Our system leverages advanced Market Basket Analysis to transform raw transactional data into actionable consumer insights. By identifying deep-seated purchasing patterns across your inventory, the engine uncovers natural product affinities that drive customer behavior. This allows for the creation of smarter, data-backed cross-selling strategies and highly personalized shopping experiences.
                    </p>
                </div>
            </section>

            {/* ── CONTACTS ────────────────────────────── */}
            <section className="contact-section" id="contact">
                <div className="section-header">
                    <h2 className="section-title">Get in Touch</h2>
                    <p className="section-subtitle">Connect with us on our platforms.</p>
                </div>
                <div className="social-links-container">
                    <ul className="social-links">
                        <li><a href="#"><i className="fab fa-twitter"></i></a></li>
                        <li><a href="#"><i className="fab fa-github"></i></a></li>
                        <li><a href="#"><i className="fab fa-linkedin"></i></a></li>
                    </ul>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────── */}
            <section className="faq-section" id="faq">
                <div className="section-header">
                    <h2 className="section-title">Frequently Asked Questions</h2>
                    <p className="section-subtitle">
                        Find answers to common questions about CoBuy's Market Basket Analysis and how to get started.
                    </p>
                </div>
                <div className="accordion">
                    {[
                        {
                            q: 'What is Market Basket Analysis?',
                            a: 'Market Basket Analysis is a data mining technique used by retailers to understand the purchase behavior of customers. It discovers hidden patterns in customer purchases, finding associations between different items that customers place in their "shopping basket".'
                        },
                        {
                            q: 'How do I integrate my transaction data?',
                            a: 'Simply upload your CSV or Excel files through our intuitive Analytics interface. The system automatically handles parsing, giving you instant access to advanced pattern detection without complex integrations.'
                        },
                        {
                            q: 'Is my business data secure?',
                            a: 'Yes, your data security is our top priority. All processing is done securely, and your raw transaction data never leaves your browser once uploaded for processing in the local client environment.'
                        },
                        {
                            q: 'How long does it take to see results?',
                            a: 'The FP-Growth algorithm runs in milliseconds. As soon as you upload your dataset and click generate, the interactive dashboards, rules, and network graphs are instantly available for analysis.'
                        },
                    ].map(({ q, a }) => (
                        <details className="accordion-item" key={q}>
                            <summary>
                                {q}
                            </summary>
                            <div className="accordion-content"><p>{a}</p></div>
                        </details>
                    ))}
                </div>
            </section>

            <footer className="footer">
                <div className="footer-content">
                    <ul className="social-links">
                        <li><a href="#"><i className="fab fa-twitter"></i></a></li>
                        <li><a href="#"><i className="fab fa-github"></i></a></li>
                        <li><a href="#"><i className="fab fa-linkedin"></i></a></li>
                    </ul>
                    <p className="footer-copy">&copy; 2026 CoBuy Research Project. All rights reserved.</p>
                </div>
            </footer>
        </>
    );
}
