import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Link } from 'react-router-dom';
import '../dashboard.css';

// ── Xenon Spectrum Config (Based on your tiles) ──────────────────
const XENON_SPECTRUM = [
    { r: 34, g: 211, b: 238 },  // Cyan (High)
    { r: 20, g: 184, b: 166 },  // Teal
    { r: 16, g: 185, b: 129 },  // Emerald
    { r: 234, g: 179, b: 8 },   // Yellow
    { r: 245, g: 158, b: 11 },  // Amber
    { r: 129, g: 140, b: 248 }, // Indigo
    { r: 192, g: 132, b: 252 }, // Purple
    { r: 251, g: 113, b: 133 }  // Rose (Low)
];

const getDynamicColor = (index, total, opacity = 1) => {
    if (total <= 1) return `rgba(${XENON_SPECTRUM[0].r}, ${XENON_SPECTRUM[0].g}, ${XENON_SPECTRUM[0].b}, ${opacity})`;
    const factor = index / (total - 1);
    const section = factor * (XENON_SPECTRUM.length - 1);
    const i = Math.floor(section);
    const dist = section - i;

    if (i >= XENON_SPECTRUM.length - 1) {
        const c = XENON_SPECTRUM[XENON_SPECTRUM.length - 1];
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${opacity})`;
    }

    const c1 = XENON_SPECTRUM[i];
    const c2 = XENON_SPECTRUM[i + 1];
    const r = Math.round(c1.r + (c2.r - c1.r) * dist);
    const g = Math.round(c1.g + (c2.g - c1.g) * dist);
    const b = Math.round(c1.b + (c2.b - c1.b) * dist);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// ── Chart Builders ──────────────────────────────────────────────
const buildLineChart = (canvas, labels, data) => {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.4)');
    gradient.addColorStop(1, 'rgba(251, 113, 133, 0)');

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data,
                borderColor: '#22d3ee',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                backgroundColor: gradient,
                pointBackgroundColor: (ctx) => getDynamicColor(ctx.dataIndex, labels.length, 1),
                pointBorderColor: '#0f172a',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                y: { grid: { color: 'rgba(255,255,255,0.03)' }, border: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
};

const buildDoughnutChart = (canvas, labels, data) => {
    const backgroundColors = data.map((_, i) => getDynamicColor(i, data.length, 0.85));
    return new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: { legend: { display: false } }
        }
    });
};

const buildBarChart = (canvas, labels, data) => {
    const backgroundColors = data.map((_, i) => getDynamicColor(i, data.length, 0.5));
    const borderColors = data.map((_, i) => getDynamicColor(i, data.length, 1));
    return new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8' } },
                y: { grid: { display: false }, ticks: { color: '#f1f5f9', font: { weight: '600' } } }
            }
        }
    });
};

// ── Detail Modal Component ──────────────────────────────────
function DetailModal({ type, data, onClose }) {
    if (!data) return null;
    
    let title = "";
    let items = [];
    let icon = "";
    let color = "";

    if (type === 'TRANSACTIONS') {
        title = "Transaction Records";
        icon = "fa-shopping-cart";
        color = "#22d3ee";
        items = Array.from({ length: Math.min(data.totalTransactions || 0, 50) }).map((_, i) => `Transaction #${1000 + i}`);
    } else if (type === 'ITEMS SOLD') {
        title = "Best Selling Items";
        icon = "fa-tags";
        color = "#10b981";
        items = (data.topProducts || []).slice(0, 50).map(p => `${p.name} (${p.count} sold)`);
    } else if (type === 'PRODUCTS') {
        title = "Unique Products Catalog";
        icon = "fa-box-open";
        color = "#fbbf24";
        items = (data.topProducts || []).map(p => p.name).sort();
    } else if (type === 'PAIRS FOUND') {
        title = "Market Basket Pairs";
        icon = "fa-handshake";
        color = "#f43f5e";
        items = (data.topPairs || []).map(p => `${p.pair} (${p.conf}% match)`);
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div className="db-card" style={{ maxWidth: '500px', width: '100%', maxHeight: '80vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${color}40` }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${color}10` }}>
                    <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className={`fas ${icon}`} style={{ color }}></i>
                        {title}
                    </h4>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, scrollbarWidth: 'thin' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {items.length > 0 ? items.map((it, i) => (
                            <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1', borderLeft: `3px solid ${color}` }}>
                                {it}
                            </div>
                        )) : <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No data available to show.</div>}
                    </div>
                </div>
                <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', background: 'rgba(0,0,0,0.2)' }}>
                    <button onClick={onClose} className="primary-btn" style={{ width: 'auto', padding: '8px 24px', background: color, border: 'none' }}>Close View</button>
                </div>
            </div>
        </div>
    );
}

// ── Dashboard Component ────────────────────────────────────────
export default function Dashboard() {
    const [data, setData] = useState(null);
    const [activeKpi, setActiveKpi] = useState(null);
    const lineRef = useRef(null);
    const donutRef = useRef(null);
    const barRef = useRef(null);
    const charts = useRef({ line: null, donut: null, bar: null });

    const loadData = () => {
        const raw = localStorage.getItem('cobuy_mining_results');
        if (raw) {
            try { setData(JSON.parse(raw)); } catch (e) { console.error(e); }
        }
    };

    useEffect(() => {
        loadData();
        window.addEventListener('storage', loadData);
        window.addEventListener('focus', loadData);
        return () => {
            window.removeEventListener('storage', loadData);
            window.removeEventListener('focus', loadData);
        };
    }, []);

    useEffect(() => {
        if (!data) return;
        Object.values(charts.current).forEach(c => c?.destroy());

        const products = data.topProducts || [];
        if (lineRef.current) charts.current.line = buildLineChart(lineRef.current, products.slice(0, 8).map(p => p.name), products.slice(0, 8).map(p => p.count));
        if (donutRef.current) charts.current.donut = buildDoughnutChart(donutRef.current, products.slice(0, 6).map(p => p.name), products.slice(0, 6).map(p => p.count));
        if (barRef.current) charts.current.bar = buildBarChart(barRef.current, products.slice(0, 10).map(p => p.name), products.slice(0, 10).map(p => p.count));
    }, [data]);

    return (
        <div className="db-body" style={{ background: '#020617', minHeight: '100vh', padding: '24px' }}>
            {activeKpi && <DetailModal type={activeKpi} data={data} onClose={() => setActiveKpi(null)} />}
            
            {!data ? (
                /* Centered Banner Area */
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh', // Takes up most of the screen to ensure centering
                    textAlign: 'center'
                }}>
                    <div className="upload-banner" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px',
                        background: 'rgba(15, 23, 42, 0.4)',
                        borderRadius: '20px',
                        border: '2px dashed rgba(255,255,255,0.05)',
                        width: '100%',
                        maxWidth: '600px'
                    }}>
                        <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '20px' }}></i>
                        <div style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '25px' }}>No Analysis Data Found</div>

                        <Link to="/analytics" className="primary-btn" style={{
                            background: '#10b981',
                            color: '#fff',
                            textDecoration: 'none',
                            padding: '12px 30px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <i className="fas fa-microscope"></i>
                            Go to Analytics
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* KPI CARDS (With Icons) */}
                    <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'TRANSACTIONS', val: data.totalTransactions || data.stats?.unique_tx || 0, col: '#22d3ee', icon: 'fa-shopping-cart' },
                            { label: 'ITEMS SOLD', val: data.totalItems || data.stats?.total_rows || 0, col: '#10b981', icon: 'fa-tags' },
                            { label: 'PRODUCTS', val: data.uniqueProducts || data.stats?.unique_products || 0, col: '#fbbf24', icon: 'fa-box-open' },
                            { label: 'PAIRS FOUND', val: data.topPairs?.length || data.rules?.length || 0, col: '#f43f5e', icon: 'fa-handshake' }
                        ].map((k, i) => (
                            <div 
                                className="kpi-card" 
                                key={i} 
                                onClick={() => setActiveKpi(k.label)}
                                style={{ borderTop: `3px solid ${k.col}`, background: '#0f172a', padding: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', letterSpacing: '1.5px' }}>{k.label}</div>
                                    <i className={`fas ${k.icon}`} style={{ fontSize: '18px', color: k.col, opacity: '0.6' }}></i>
                                </div>
                                <div style={{ fontSize: '36px', color: '#fff', fontWeight: '800' }}>{k.val}</div>
                                <div style={{ fontSize: '10px', color: k.col, marginTop: '8px', fontWeight: 600 }}>Click to view details <i className="fas fa-chevron-right" style={{ marginLeft: '4px' }}></i></div>
                            </div>
                        ))}
                    </div>


                    <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1.5fr', gap: '20px' }}>
                        {/* 1. Line Chart */}
                        <div className="db-card" style={{ background: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ color: '#fff', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-chart-line" style={{ color: '#22d3ee' }}></i>
                                Sales Momentum
                            </div>
                            <div style={{ height: '220px' }}><canvas ref={lineRef}></canvas></div>
                        </div>

                        {/* 2. Doughnut Chart */}
                        <div className="db-card" style={{ background: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-chart-pie" style={{ color: '#c084fc' }}></i>
                                Market Share
                            </div>
                            <div style={{ height: '140px', margin: '15px 0' }}><canvas ref={donutRef}></canvas></div>
                            <div className="donut-legend">
                                {data.topProducts?.slice(0, 5).map((p, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getDynamicColor(i, 6), marginRight: '10px' }}></span>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.name}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#fff', fontWeight: '600' }}>{p.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Association Intelligence (Multi-color progress bars) */}
                        <div className="db-card" onClick={() => setActiveKpi('PAIRS FOUND')} style={{ background: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                            <div style={{ color: '#fff', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-project-diagram" style={{ color: '#f59e0b' }}></i>
                                    Product Recommendations
                                </div>
                                <span style={{ fontSize: '9px', background: '#22d3ee', color: '#020617', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>BEST MATCHES</span>
                            </div>
                            <div style={{ marginTop: '25px' }}>
                                {data.topPairs && data.topPairs.length > 0 ? data.topPairs.slice(0, 5).map((p, i) => (
                                    <div key={i} style={{ marginBottom: '18px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                            <span style={{ color: '#cbd5e1' }}>{p.pair}</span>
                                            <span style={{ color: getDynamicColor(i, 5), fontWeight: '700' }}>{p.conf}%</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                                            <div style={{
                                                width: `${p.conf}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, ${getDynamicColor(i, 5)}, ${getDynamicColor(i + 1, 5)})`,
                                                borderRadius: '10px',
                                                boxShadow: `0 0 10px ${getDynamicColor(i, 5, 0.3)}`
                                            }}></div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', color: '#475569', marginTop: '40px' }}>
                                        <i className="fas fa-handshake" style={{ fontSize: '32px', marginBottom: '10px', display: 'block', opacity: 0.2 }}></i>
                                        Upload data to see matches
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Ranking Chart */}
                    <div className="db-card" style={{ marginTop: '24px', background: '#0f172a', padding: '28px', borderRadius: '16px' }}>
                        <div style={{ color: '#fff', fontWeight: '700', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-list-ol" style={{ color: '#10b981' }}></i>
                            Most Sold Products
                        </div>
                        <div style={{ height: '360px' }}><canvas ref={barRef}></canvas></div>
                    </div>
                </>
            )}
        </div>
    );
}