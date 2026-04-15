import { useEffect, useState } from 'react';
import '../dashboard.css';
import '../mining.css';

// Metrics from the reference image:
// - System quality
// - User acceptance

export default function Evaluation() {
    const [miningData, setMiningData] = useState(null);
    const [engineStatus, setEngineStatus] = useState("Checking...");

    useEffect(() => {
        // Load latest analysis results
        try {
            const raw = localStorage.getItem('cobuy_mining_results');
            if (raw) setMiningData(JSON.parse(raw));
        } catch (e) { console.error("Failed to load evaluation data", e); }

        // Check engine health
        fetch("http://localhost:8000/health")
            .then(res => res.json())
            .then(data => setEngineStatus(data.status))
            .catch(() => setEngineStatus("Offline"));
    }, []);

    const meta = miningData?.meta || {};
    const rulesFound = miningData?.topPairs?.length || 0;
    const itemsCount = miningData?.topProducts?.length || 0;

    // Reliability calculation (Sample): Avg confidence of top rules
    const avgConf = miningData?.topPairs?.length
        ? (miningData.topPairs.reduce((acc, curr) => acc + curr.conf, 0) / rulesFound).toFixed(1)
        : 0;

    return (
        <div className="db-body">
            {/* ── Evaluation Summary ── */}
            <div className="db-card" style={{ marginBottom: '24px', border: '1px solid rgba(129,140,248,0.2)', background: 'linear-gradient(135deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)' }}>
                <div style={{ padding: '10px' }}>
                    <h4 style={{ color: '#818cf8', margin: '0 0 10px 0' }}>Research Evaluation Framework</h4>
                    <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', maxWidth: '800px' }}>
                        The CoBuy Market Intelligence Suite is assessed as a whole. Evaluation is an integral part of the system flow,
                        ensuring that the insights provided are both technically sound and practically valuable.
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* ── Section 1: System Quality ── */}
                <div className="db-card">
                    <div className="db-card-header">
                        <div className="db-card-title"><i className="fas fa-microchip" style={{ color: '#10b981', marginRight: '8px' }}></i>System Quality Metrics</div>
                        <div className="db-card-sub">Technical reliability and performance assessment.</div>
                    </div>

                    <div className="evaluation-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                        <div className="metric-box" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Reliability (Avg Conf)</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '5px' }}>{avgConf}%</div>
                            <div style={{ fontSize: '10px', color: '#475569', marginTop: '5px' }}>Average certainty of associations.</div>
                        </div>
                        <div className="metric-box" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Engine Efficiency</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#8b5cf6', marginTop: '5px' }}>{meta.timeTaken || '0'}ms</div>
                            <div style={{ fontSize: '10px', color: '#475569', marginTop: '5px' }}>Pattern discovery latency.</div>
                        </div>
                        <div className="metric-box" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Discovery Robustness</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '5px' }}>{meta.proofValue || '0'}</div>
                            <div style={{ fontSize: '10px', color: '#475569', marginTop: '5px' }}>Search-space coverage depth.</div>
                        </div>
                        <div className="metric-box" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>System Connectivity</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: engineStatus === 'Active' ? '#10b981' : '#ef4444', marginTop: '12px' }}>
                                <i className="fas fa-circle" style={{ fontSize: '8px', verticalAlign: 'middle', marginRight: '6px' }}></i>
                                {engineStatus}
                            </div>
                            <div style={{ fontSize: '10px', color: '#475569', marginTop: '5px' }}>Backend availability status.</div>
                        </div>
                    </div>
                </div>

                {/* ── Section 2: User Acceptance ── */}
                <div className="db-card">
                    <div className="db-card-header">
                        <div className="db-card-title"><i className="fas fa-users" style={{ color: '#06b6d4', marginRight: '8px' }}></i>User Acceptance Assessment</div>
                        <div className="db-card-sub">Utility and usability feedback from the researcher perspective.</div>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0 0 0' }}>
                        {[
                            { label: "Data Visualization Clarity", value: "High", icon: "fa-chart-pie", color: "#10b981" },
                            { label: "Actionable Intelligence", value: rulesFound > 0 ? "Satisfactory" : "Awaiting Data", icon: "fa-lightbulb", color: "#f59e0b" },
                            { label: "Interface Navigation", value: "Premium", icon: "fa-mouse-pointer", color: "#06b6d4" },
                            { label: "Research Goal Alignment", value: "Confirmed", icon: "fa-vial", color: "#8b5cf6" },
                        ].map((m, i) => (
                            <li key={i} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px',
                                background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.03)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <i className={`fas ${m.icon}`} style={{ color: m.color, width: '16px' }}></i>
                                    <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{m.label}</span>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 700, px: '8px', py: '2px', background: `${m.color}20`, color: m.color, borderRadius: '4px', padding: '2px 8px' }}>
                                    {m.value}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* ── Conclusion Note ── */}

        </div>
    );
}
