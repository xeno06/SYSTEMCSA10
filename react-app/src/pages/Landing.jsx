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
            </nav>

            {/* ── HERO ───────────────────────────────────── */}
            <section className="hero" id="hero">
                <canvas className="hero-canvas-bg" ref={canvasRef} id="networkCanvas"></canvas>
                <div className="hero-container">
                    <div className="hero-text">
                        <div className="hero-badge">ADVANCED MARKET BASKET ANALYSIS</div>
                        <h1 className="hero-title">Stop Guessing,<br />Start Growing.</h1>
                        <p className="hero-subtitle">
                            Transform raw transaction data into actionable consumer insights. Uncover<br />hidden purchasing patterns, optimize inventory, and boost sales with our<br />advanced data mining algorithm.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/auth?register=true" className="btn btn-primary">
                                Get Started Now <i className="fas fa-arrow-right"></i>
                            </Link>
                            <Link to="/auth" className="btn btn-dark-flat">
                                Login to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ─────────────────────────────── */}
            <section className="features" id="features" style={{ paddingTop: '140px', paddingBottom: '100px', paddingLeft: '5%', paddingRight: '5%', textAlign: 'center', background: '#0b1120' }}>
                <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '800px', margin: '0 auto 60px auto', position: 'relative', zIndex: 10 }}>
                    Discover the powerful tools CoBuy provides to help you understand your customers, optimize your inventory, and build smarter sales strategies.
                </p>

                <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    {[
                        {
                            color: '#10b981', icon: 'fa-chart-pie',
                            title: 'Best-Seller Analytics',
                            desc: 'Instantly see your most popular products at a glance, so you always know what your customers are looking for and can keep your best inventory in stock.',
                        },
                        {
                            color: '#10b981', icon: 'fa-project-diagram',
                            title: 'Shopping Habit Analysis',
                            desc: 'Our system automatically finds which items are usually bought together, allowing you to create perfect product bundles and smarter store layouts without the guesswork.',
                        },
                        {
                            color: '#10b981', icon: 'fa-history',
                            title: 'Smart History Records',
                            desc: 'Access a complete, organized digital history of every transaction to track your business growth and review past performance anytime.',
                        }
                    ].map(({ color, icon, title, desc }) => (
                        <div className="feature-card" key={title} style={{ background: '#222b3c', border: '1px solid #2e3a50', borderRadius: '12px', padding: '40px 32px', textAlign: 'left', minHeight: '320px', position: 'relative', zIndex: 10 }}>
                            <div className="feature-icon-wrapper" style={{ marginBottom: '24px' }}>
                                <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'transparent', width: '40px', height: '40px', borderRadius: '10px' }}>
                                    <i className={`fas ${icon}`}></i>
                                </div>
                            </div>
                            <h3 style={{ fontSize: '20px', margin: '0 0 16px 0', color: '#fff', fontWeight: 'bold' }}>{title}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── ABOUT ─────────────────────────── */}
            <section className="about" id="about" style={{ padding: '100px 8%', textAlign: 'center', background: '#0b1120' }}>
                <h2 style={{ fontSize: '36px', fontWeight: 800 }}>About</h2>
                <p style={{ marginTop: '30px', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: '850px', margin: '30px auto 0', color: '#f1f5f9' }}>
                    Our system leverages advanced Market Basket Analysis to transform raw transactional data into actionable consumer insights. By identifying deep-seated purchasing patterns across your inventory, the engine uncovers natural product affinities that drive customer behavior. This allows for the creation of smarter, data-backed cross-selling strategies and highly personalized shopping experiences.
                </p>
            </section>

            {/* ── CONTACTS ────────────────────────────── */}
            <section className="contact" id="contact" style={{ background: '#0b1120', padding: '100px 8%', textAlign: 'center' }}>
                <h2 style={{ fontSize: '36px', fontWeight: 800 }}>Contacts</h2>
                <p style={{ marginTop: '12px', color: '#64748b', fontSize: '1rem', marginBottom: '40px' }}>
                    Connect with us on our platforms.
                </p>
                <ul className="social-links" style={{ margin: 0, display: 'flex', justifyContent: 'center', gap: '20px', listStyle: 'none', padding: 0 }}>
                    <li><a href="#" style={{ color: '#94a3b8', fontSize: '24px', transition: 'color 0.2s' }}><i className="fab fa-twitter"></i></a></li>
                    <li><a href="#" style={{ color: '#94a3b8', fontSize: '24px', transition: 'color 0.2s' }}><i className="fab fa-github"></i></a></li>
                    <li><a href="#" style={{ color: '#94a3b8', fontSize: '24px', transition: 'color 0.2s' }}><i className="fab fa-linkedin"></i></a></li>
                </ul>
            </section>

            {/* ── FAQ ──────────────────────────────────── */}
            <section className="help" id="faq" style={{ background: '#0b1120', padding: '80px 8%', textAlign: 'center' }}>
                <h2 style={{ fontSize: '36px', fontWeight: 800 }}>FAQs</h2>
                <p style={{ marginTop: '12px', color: '#64748b', fontSize: '1rem' }}>
                    Find answers to common questions about CoBuy's Market Basket Analysis and how to get started.
                </p>
                <div className="accordion" style={{ maxWidth: '800px', margin: '40px auto 0' }}>
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
                        <details className="accordion-item" key={q} style={{ background: '#1c2438', border: '1px solid #2e3a50', borderRadius: '8px', marginBottom: '12px', textAlign: 'left' }}>
                            <summary style={{ padding: '20px', fontWeight: 600, color: '#f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {q}
                                <i className="fas fa-chevron-down" style={{ fontSize: '12px', color: '#64748b' }}></i>
                            </summary>
                            <div className="accordion-content" style={{ padding: '0 20px 20px 20px', color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}><p>{a}</p></div>
                        </details>
                    ))}
                </div>
            </section>

            <div style={{ background: '#0b1120', paddingBottom: '48px', display: 'flex', justifyContent: 'center' }}>
                <ul className="social-links" style={{ margin: 0 }}>
                    <li><a href="#"><i className="fab fa-twitter"></i></a></li>
                    <li><a href="#"><i className="fab fa-github"></i></a></li>
                    <li><a href="#"><i className="fab fa-linkedin"></i></a></li>
                </ul>
            </div>
        </>
    );
}
