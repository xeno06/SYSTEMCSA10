import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../dashboard.css';

export default function Settings() {
    const navigate = useNavigate();
    const [support, setSupport] = useState(5);
    const [confidence, setConfidence] = useState(20);
    const [physics, setPhysics] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [saved, setSaved] = useState(false);
    const [cleared, setCleared] = useState(false);

    useEffect(() => {
        const s = localStorage.getItem('cobuy_min_support');
        const c = localStorage.getItem('cobuy_min_confidence');
        const p = localStorage.getItem('cobuy_physics');
        const t = localStorage.getItem('cobuy_theme');
        if (s) setSupport(Number(s));
        if (c) setConfidence(Number(c));
        if (p) setPhysics(p !== 'false');
        if (t) setDarkMode(t !== 'light');
    }, []);

    const toggleTheme = (isDark) => {
        setDarkMode(isDark);
        const newTheme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('cobuy_theme', newTheme);
    };

    const handleSave = () => {
        localStorage.setItem('cobuy_min_support', support);
        localStorage.setItem('cobuy_min_confidence', confidence);
        localStorage.setItem('cobuy_physics', physics.toString());
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleClearData = () => {
        localStorage.removeItem('cobuy_mining_results');
        setCleared(true);
        setTimeout(() => { setCleared(false); navigate('/analytics'); }, 1800);
    };

    const hasMining = !!localStorage.getItem('cobuy_mining_results');
    const miningMeta = (() => {
        try {
            const d = JSON.parse(localStorage.getItem('cobuy_mining_results') || '{}');
            return d.analysedAt ? new Date(d.analysedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : null;
        } catch { return null; }
    })();

    return (
        <div className="db-body">

            {/* ── Algorithm Engine ─────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="db-card">
                    <div className="db-card-header" style={{ marginBottom: '4px' }}>
                        <div>
                            <div className="db-card-title">
                                <i className="fas fa-microchip" style={{ color: '#10b981', marginRight: '8px' }}></i>
                                Algorithm Thresholds
                            </div>
                            <div className="db-card-sub">Control FP-Growth sensitivity for the next recommendation run</div>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="settings-group">
                        <div className="settings-row">
                            <div>
                                <div className="settings-label">Minimum Support</div>
                                <div className="settings-desc">How frequently an item must appear across all transactions to be included in pattern mining.</div>
                            </div>
                            <span className="settings-value">{support}%</span>
                        </div>
                        <input type="range" className="glass-slider" min="1" max="20" value={support}
                            onChange={e => setSupport(Number(e.target.value))} />
                        <div className="settings-scale">
                            <span>1% — Find rare patterns</span>
                            <span>20% — Only dominant items</span>
                        </div>
                    </div>

                    {/* Confidence */}
                    <div className="settings-group">
                        <div className="settings-row">
                            <div>
                                <div className="settings-label">Minimum Confidence</div>
                                <div className="settings-desc">The minimum probability required before two products are considered a valid buying association.</div>
                            </div>
                            <span className="settings-value">{confidence}%</span>
                        </div>
                        <input type="range" className="glass-slider" min="5" max="80" step="5" value={confidence}
                            onChange={e => setConfidence(Number(e.target.value))} />
                        <div className="settings-scale">
                            <span>5% — Loose associations</span>
                            <span>80% — Near-certain pairs</span>
                        </div>
                    </div>

                    <div className="settings-info-box">
                        <i className="fas fa-lightbulb" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
                        <span>Lowering both thresholds uncovers rare patterns but increases processing time significantly.</span>
                    </div>

                    <button className="settings-save-btn" onClick={handleSave} style={{ background: saved ? '#059669' : '' }}>
                        {saved
                            ? <><i className="fas fa-check"></i> Saved Successfully!</>
                            : <><i className="fas fa-save"></i> Save Threshold Settings</>}
                    </button>
                </div>

                {/* ── Physics & Network ─── */}
                <div className="db-card">
                    <div className="db-card-header" style={{ marginBottom: '4px' }}>
                        <div>
                            <div className="db-card-title">
                                <i className="fas fa-atom" style={{ color: '#8b5cf6', marginRight: '8px' }}></i>
                                Network Graph Display
                            </div>
                            <div className="db-card-sub">Analytics visualization preferences</div>
                        </div>
                    </div>

                    <div className="settings-toggle-row">
                        <div>
                            <div className="settings-label">WebGL Physics Simulation</div>
                            <div className="settings-desc">When enabled, the product network graph animates with a physics engine — nodes repel and attract naturally. Disable to reduce CPU usage on low-powered devices.</div>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={physics} onChange={e => setPhysics(e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="settings-toggle-row">
                        <div>
                            <div className="settings-label">Dark Mode</div>
                            <div className="settings-desc">Switch between professional dark terminal and clean light business themes.</div>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={darkMode} onChange={e => toggleTheme(e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="settings-info-box" style={{ marginTop: '20px', borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.05)' }}>
                        <i className="fas fa-info-circle" style={{ color: '#8b5cf6', marginRight: '8px' }}></i>
                        <span>Physics changes will take effect the next time you open the Analytics page.</span>
                    </div>

                </div>
            </div>

            {/* ── Data Management ─────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Mining data status */}
                <div className="db-card">
                    <div className="db-card-header">
                        <div>
                            <div className="db-card-title">
                                <i className="fas fa-database" style={{ color: '#06b6d4', marginRight: '8px' }}></i>
                                Stored Analysis Data
                            </div>
                            <div className="db-card-sub">Results cached from the last analytics run</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Analysis Status</span>
                            <span style={{ color: hasMining ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '14px' }}>
                                {hasMining ? '✓ Data Available' : '✗ No Data'}
                            </span>
                        </div>
                        {miningMeta && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Last Run</span>
                                <span style={{ color: '#f1f5f9', fontSize: '14px' }}>{miningMeta}</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button className="settings-save-btn" style={{ flex: 1, background: '#1d4ed8' }} onClick={() => navigate('/analytics')}>
                            <i className="fas fa-microscope"></i> Go to Analytics
                        </button>
                        <button
                            className="settings-save-btn"
                            style={{ flex: 1, background: cleared ? '#059669' : '#7f1d1d', opacity: hasMining ? 1 : 0.4 }}
                            onClick={hasMining ? handleClearData : undefined}
                            disabled={!hasMining}
                        >
                            {cleared
                                ? <><i className="fas fa-check"></i> Cleared!</>
                                : <><i className="fas fa-trash-alt"></i> Clear Data</>}
                        </button>
                    </div>
                </div>

                {/* About the system */}
                <div className="db-card">
                    <div className="db-card-header">
                        <div>
                            <div className="db-card-title">
                                <i className="fas fa-shield-alt" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
                                System Information
                            </div>
                            <div className="db-card-sub">CoBuy platform details</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                        {[
                            { label: 'Platform', val: 'CoBuy Market Intelligence Suite' },
                            { label: 'Algorithm', val: 'FP-Growth + Apriori' },
                            { label: 'Data Storage', val: 'Browser localStorage (client-side)' },
                            { label: 'Formats', val: '.csv, .xls, .xlsx' },
                            { label: 'Version', val: '2.0.0 Business' },
                        ].map(({ label, val }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#475569', fontSize: '13px' }}>{label}</span>
                                <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
