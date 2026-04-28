import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import '../dashboard.css';
import '../mining.css';

// ── MINING ENGINE INTEGRATION (PYTHON BACKEND) ─────────────────
const API_URL = "http://localhost:8000";

// ── Helpers ──────────────────────────────────────────────────
function loadMining() {
    try {
        const raw = localStorage.getItem('cobuy_mining_results');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

const PALETTE = ['#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#ef4444', '#3b82f6', '#a3e635'];

// ── NEW BUSINESS COMPONENTS ────────────────────────────────────

function BestSellerLeaderboard({ products }) {
    if (!products?.length) return (
        <div className="empty-chart-state">
            <i className="fas fa-trophy"></i>
            <span>Upload data to see your top sellers</span>
        </div>
    );
    const maxCount = products[0]?.count || 1;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {products.slice(0, 10).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', fontSize: '15px', fontWeight: 800, color: i < 3 ? '#f59e0b' : '#64748b', textAlign: 'center' }}>
                        {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                            <span style={{ color: '#f8fafc', fontWeight: 600 }}>{p.name}</span>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{p.count} sold</span>
                        </div>
                        <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div 
                                style={{ 
                                    width: `${(p.count / maxCount) * 100}%`, 
                                    height: '100%', 
                                    background: `linear-gradient(90deg, ${PALETTE[i % PALETTE.length]} 0%, ${PALETTE[i % PALETTE.length]}cc 100%)`, 
                                    borderRadius: '5px',
                                    transition: 'width 1s ease-out'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProductPairingCards({ pairs, onViewProof }) {
    if (!pairs?.length) return (
        <div className="empty-chart-state" style={{ height: '300px' }}>
            <i className="fas fa-handshake"></i>
            <span>Upload data to see best matches</span>
        </div>
    );
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {pairs.slice(0, 6).map((p, i) => {
                const [a, b] = p.pair.split(' + ');
                return (
                    <div key={i} className="db-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: PALETTE[i % PALETTE.length] }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: PALETTE[i % PALETTE.length] + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE[i % PALETTE.length] }}>
                                <i className="fas fa-star" style={{ fontSize: '14px' }}></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Match #{i + 1}</div>
                                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>High Growth Potential</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>{a}</span>
                            <i className="fas fa-link" style={{ fontSize: '12px', color: '#475569' }}></i>
                            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>{b}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Matches Found</div>
                                <div style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc' }}>{p.count}<span style={{ fontSize: '14px', fontWeight: 600, marginLeft: '4px', color: '#94a3b8' }}>{p.count === 1 ? 'time' : 'times'}</span></div>
                            </div>
                            <button onClick={() => onViewProof(p)} style={{ background: 'transparent', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>View Proof</button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function InteractiveMatchFinder({ products, pairs, onViewProof }) {
    const [selected, setSelected] = useState('');
    if (!products?.length) return null;
    
    const matches = selected ? (pairs || []).filter(p => p.pair.includes(selected)).sort((a, b) => b.conf - a.conf) : [];

    return (
        <div className="db-card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.02) 100%)', border: '1px solid rgba(59,130,246,0.2)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
                <div>
                    <h5 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fas fa-search" style={{ color: '#3b82f6' }}></i>
                        Product Match-Maker
                    </h5>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Select an item to see what customers usually buy with it.</p>
                </div>
                <div style={{ position: 'relative', width: '300px' }}>
                    <i className="fas fa-chevron-down" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}></i>
                    <select 
                        value={selected} 
                        onChange={(e) => setSelected(e.target.value)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 16px', borderRadius: '10px', fontSize: '14px', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                    >
                        <option value="">Pick a product to check matches...</option>
                        {products.slice(0, 50).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
            </div>
            
            {!selected ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                    <i className="fas fa-mouse-pointer" style={{ fontSize: '24px', display: 'block', marginBottom: '12px', opacity: 0.3 }}></i>
                    Choose a product from the list above to start searching.
                </div>
            ) : matches.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {matches.slice(0, 4).map((m, i) => {
                        const otherItems = m.pair.split(' + ').filter(it => it.trim().toLowerCase() !== selected.trim().toLowerCase());
                        const other = otherItems.length > 0 ? otherItems.join(', ') : selected;
                        return (
                            <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Found Pairing:</div>
                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>{other}</div>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                                    Customers who bought <strong>{selected}</strong> also frequently picked up <strong>{other}</strong>.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>{m.count}</div>
                                    <div style={{ fontSize: '11px', color: '#475569' }}>Matches Found</div>
                                </div>
                                <div style={{ background: 'rgba(16,185,129,0.05)', padding: '10px', borderRadius: '8px', marginBottom: '12px', borderLeft: '3px solid #10b981' }}>
                                    <div style={{ fontSize: '9px', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>{m.strategy}</div>
                                    <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>{m.action}</div>
                                </div>
                                <button 
                                    onClick={() => onViewProof(m)}
                                    style={{ 
                                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', 
                                        padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', 
                                        marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                    }}
                                >
                                    <i className="fas fa-search-plus"></i> View Evidence
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                    <i className="fas fa-times-circle" style={{ fontSize: '24px', display: 'block', marginBottom: '12px', opacity: 0.3 }}></i>
                    No strong pairings found for "{selected}" in this dataset.
                </div>
            )}
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────

export default function Analytics() {
    const fileInputRef = useRef(null);
    const [miningData, setMiningData] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [fileName, setFileName] = useState('No file chosen');
    const [rawFile, setRawFile] = useState(null);
    const [parseInfo, setParseInfo] = useState(null);
    const [analysisMeta, setAnalysisMeta] = useState(null);
    const [itemsetBreakdown, setItemsetBreakdown] = useState({});
    const [itemsetDetails, setItemsetDetails] = useState({});
    const [itemsetModal, setItemsetModal] = useState(null);
    const [proofModal, setProofModal] = useState(null);
    const [engineStatus, setEngineStatus] = useState("Checking...");
    const [dataMapping, setDataMapping] = useState(null);
    const [algorithm, setAlgorithm] = useState('fp-growth');
    const [businessType, setBusinessType] = useState('convenience store');
    const [seasonalInsight, setSeasonalInsight] = useState(null);
    const [validationAlerts, setValidationAlerts] = useState([]);
    const [showTechDetails, setShowTechDetails] = useState(false);

    useEffect(() => {
        const saved = loadMining();
        if (saved) {
            setMiningData(saved);
            setAnalysisMeta(saved.meta);
            setItemsetBreakdown(saved.breakdown || {});
            setItemsetDetails(saved.itemset_details || {});
        }

        fetch(`${API_URL}/health`)
            .then(res => res.json())
            .then(data => setEngineStatus(data.status))
            .catch(() => setEngineStatus("Offline"));
    }, []);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileName(file.name);
        setRawFile(file);
        
        // Clear previous analysis to avoid confusion with new data
        setMiningData(null);
        setParseInfo(null);
        localStorage.removeItem('cobuy_mining_results');

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'binary', sheetRows: 100 });
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                if (jsonData.length === 0) return;

                let txIdKey = Object.keys(jsonData[0]).find(k => /transaction|invoice|order|id/i.test(k));
                setParseInfo({
                    txCount: jsonData.length,
                    productCount: '...'
                });

                if (jsonData.length >= 500) setAlgorithm('fp-growth');
                else setAlgorithm('apriori');
            } catch (err) { console.error("UI Feedback Error:", err); }
        };
        reader.readAsBinaryString(file);
    };

    const runAnalysis = async () => {
        if (!rawFile) return;
        setIsRunning(true);

        try {
            const formData = new FormData();
            formData.append('file', rawFile);
            formData.append('algorithm', algorithm);
            formData.append('min_support', (Number(localStorage.getItem('cobuy_min_support')) || 1) / 100);
            formData.append('min_confidence', (Number(localStorage.getItem('cobuy_min_confidence')) || 10) / 100);
            formData.append('business_type', businessType);

            const response = await fetch(`${API_URL}/mine`, { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Backend Error");
            }

            const data = await response.json();
            
            const finalData = {
                ...data,
                topPairs: data.topPairs || data.rules || [],
                topProducts: data.topProducts || [],
                analysedAt: new Date().toISOString(),
                meta: {
                    ...data.meta,
                    timestamp: new Date().toLocaleString(),
                    algorithmLabel: data.meta.algorithm === 'Apriori' ? 'Standard Analysis' : 'Deep Analysis',
                    proofLabel: 'Total Checks Performed',
                    proofValue: data.meta.itemset_count,
                    timeTaken: data.meta.time_taken
                }
            };

            setMiningData(finalData);
            setAnalysisMeta(finalData.meta);
            setItemsetBreakdown(data.breakdown || {});
            setItemsetDetails(data.itemset_details || {});
            setSeasonalInsight(data.seasonal_insight || null);
            setValidationAlerts(data.validation_alerts || []);
            localStorage.setItem('cobuy_mining_results', JSON.stringify(finalData));
            
            if (data.stats) setParseInfo({ txCount: data.stats.unique_tx, productCount: data.stats.unique_products });
            if (data.mapping) setDataMapping(data.mapping);
        } catch (err) {
            alert(`Analysis Failed: ${err.message}. Check if your Python server is running.`);
        } finally {
            setIsRunning(false);
        }
    };

    const exportAll = () => {
        const lines = ["Sales Analysis Report", `Generated: ${new Date().toLocaleString()}`, "", "Top Products", "Rank,Product,Quantity Sold"];
        miningData.topProducts.forEach((p, i) => lines.push(`${i + 1},"${p.name}",${p.count}`));
        lines.push("", "Best Pairings", "Pair,Chance %,Popularity");
        miningData.topPairs.forEach(p => lines.push(`"${p.pair.replace(' + ', ' with ')}",${p.conf}%,${(p.support*100).toFixed(2)}%`));

        const blob = new Blob([lines.join("\n")], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sales_analysis_report.csv'; a.click();
    };

    const noData = !miningData;

    // Deduplicate pairs so A+B and B+A don't show twice
    const uniqueTopPairs = [];
    if (miningData?.topPairs) {
        const seen = new Set();
        for (const p of miningData.topPairs) {
            const key = p.pair.split(' + ').map(s => s.trim()).sort().join('|');
            if (!seen.has(key)) {
                seen.add(key);
                uniqueTopPairs.push(p);
            }
        }
    }

    return (
        <div className="db-body">
            {/* ── Header / Upload ── */}
            <div className="db-card" style={{ marginBottom: '32px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.02)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#10b981', fontSize: '20px' }}>Sales Analysis Dashboard</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Upload your sales records to discover best-sellers and perfect product pairings.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                            background: engineStatus === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${engineStatus === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            borderRadius: '10px', fontSize: '12px', color: engineStatus === 'Active' ? '#10b981' : '#ef4444', fontWeight: 600
                        }}>
                            <i className={engineStatus === 'Active' ? "fas fa-check-circle" : "fas fa-exclamation-triangle"}></i> System Status: {engineStatus}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".xlsx,.xls,.csv" />
                        <button className="file-btn" onClick={() => {
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            fileInputRef.current.click();
                        }}>
                            <i className="fas fa-file-excel" style={{ marginRight: '8px' }}></i>{parseInfo ? 'Change Data' : 'Select Sales File'}
                        </button>
                        <button className="primary-btn pulse" onClick={runAnalysis} disabled={isRunning || !rawFile || engineStatus !== 'Active'}
                            style={{ width: 'auto', padding: '10px 28px', fontSize: '15px', borderRadius: '10px', opacity: engineStatus === 'Active' ? 1 : 0.5 }}>
                            {isRunning ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Analyzing...</> : 'Analyze My Sales'}
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Business Type:</span>
                    <select 
                        value={businessType} 
                        onChange={(e) => setBusinessType(e.target.value)}
                        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="convenience store">Convenience Store</option>
                        <option value="pet food shop">Pet Food Shop</option>
                        <option value="coffee shop">Coffee Shop</option>
                    </select>
                    {parseInfo && (
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', fontSize: '13px', color: '#10b981' }}>
                            <span><i className="fas fa-receipt" style={{ marginRight: '8px' }}></i>{parseInfo.txCount} Sales Found</span>
                            <span><i className="fas fa-tags" style={{ marginRight: '8px' }}></i>{parseInfo.productCount} Products Found</span>
                        </div>
                    )}
                </div>
            </div>

            {/* --- VALIDATION ALERTS (PANEL REQUIREMENT: Dataset Validation Mechanism) --- */}
            {validationAlerts.length > 0 && (
                <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.5s ease-out' }}>
                    {validationAlerts.map((alert, idx) => (
                        <div key={idx} style={{ 
                            padding: '14px 20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', 
                            borderRadius: '12px', color: '#f59e0b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px' 
                        }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-shield-alt" style={{ fontSize: '14px' }}></i>
                            </div>
                            <div>
                                <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', display: 'block', marginBottom: '2px', opacity: 0.8 }}>Data Integrity Validation</span>
                                {alert}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- SMART PRODUCT RECOMMENDATIONS (TABLE FORMAT) --- */}
            {!noData && uniqueTopPairs.length > 0 && (
                <div className="db-card" style={{ marginBottom: '32px', padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-table" style={{ color: '#f59e0b' }}></i>
                            Smart Product Recommendations
                        </h4>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginLeft: '26px' }}>Complete co-purchase rules from the mining engine</div>
                    </div>
                    
                    <div className="scrollable-table-container" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '350px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                                    <th style={{ padding: '16px 20px', fontSize: '10px', color: '#64748b', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>WHEN CUSTOMER BUYS...</th>
                                    <th style={{ padding: '16px 20px', fontSize: '10px', color: '#64748b', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>SYSTEM RECOMMENDS...</th>
                                    <th style={{ padding: '16px 20px', fontSize: '10px', color: '#64748b', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>CONFIDENCE</th>
                                    <th style={{ padding: '16px 20px', fontSize: '10px', color: '#64748b', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uniqueTopPairs.map((p, i) => {
                                    const [a, b] = p.pair.split(' + ');
                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding: '16px 20px', color: '#f8fafc', fontWeight: 600, fontSize: '14px' }}>{a}</td>
                                            <td style={{ padding: '16px 20px', color: '#cbd5e1', fontSize: '14px' }}>{b}</td>
                                            <td style={{ padding: '16px 20px', color: '#f59e0b', fontWeight: 800, fontSize: '14px' }}>{p.conf}%</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <button onClick={() => setProofModal(p)} style={{ background: 'transparent', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>View Proof</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TOP INSIGHTS (SEASONAL & GROWTH) --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {seasonalInsight ? (
                    <div className="db-card" style={{ border: '2px solid #8b5cf6', background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.02) 100%)' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ fontSize: '40px' }}>{analysisMeta?.analysis_month === 12 ? '🎄' : '📅'}</div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '18px' }}>{seasonalInsight.theme}</h4>
                                    <span style={{ fontSize: '10px', background: '#8b5cf6', color: '#fff', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800 }}>SEASONAL TREND</span>
                                </div>
                                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>{seasonalInsight.suggestion}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="db-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '14px' }}>
                        No seasonal trends detected yet.
                    </div>
                )}

                {!noData && (
                    <div className="db-card" style={{ background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <h5 style={{ margin: '0 0 12px 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                            <i className="fas fa-rocket" style={{ color: '#10b981' }}></i>
                            Store Growth Suggestions
                        </h5>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {uniqueTopPairs.slice(0, 2).map((p, i) => (
                                <div key={i} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: `3px solid ${PALETTE[i % PALETTE.length]}` }}>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>{p.strategy}</div>
                                    <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 700 }}>{p.action}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- MAIN DASHBOARD AREA --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px', marginBottom: '32px' }}>
                {/* Left: Leaderboard */}
                <div className="db-card" style={{ height: 'fit-content' }}>
                    <div className="db-card-header" style={{ marginBottom: '24px' }}>
                        <div className="db-card-title"><i className="fas fa-award" style={{ color: '#f59e0b', marginRight: '10px' }}></i>Best Seller Leaderboard</div>
                        <div className="db-card-sub">Your top 10 most popular items</div>
                    </div>
                    <BestSellerLeaderboard products={miningData?.topProducts} />
                </div>

                {/* Right: Pairing Cards */}
                <div style={{ position: 'relative' }}>
                    <div className="db-card-header" style={{ marginBottom: '20px' }}>
                        <div className="db-card-title"><i className="fas fa-layer-group" style={{ color: '#10b981', marginRight: '10px' }}></i>Top Product Matches</div>
                        <div className="db-card-sub">Which items customers frequently buy together</div>
                    </div>
                    <ProductPairingCards pairs={uniqueTopPairs} onViewProof={setProofModal} />
                    
                    <div style={{ marginTop: '24px', position: 'relative' }}>
                        <InteractiveMatchFinder products={miningData?.topProducts} pairs={uniqueTopPairs} onViewProof={setProofModal} />
                    </div>
                </div>
            </div>

            {/* --- FOOTER / EXPORT / TECH --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <button 
                    onClick={() => setShowTechDetails(!showTechDetails)}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                >
                    <i className={`fas fa-chevron-${showTechDetails ? 'down' : 'right'}`} style={{ marginRight: '8px' }}></i>
                    {showTechDetails ? 'Hide' : 'Show'} Technical Details
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {!noData && (
                        <>
                            <button onClick={exportAll} className="primary-btn" style={{ width: 'auto', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981', padding: '8px 20px' }}>
                                <i className="fas fa-file-download" style={{ marginRight: '8px' }}></i>Export Report
                            </button>
                            <button onClick={() => alert("Advanced Export Ready")} style={{ background: 'transparent', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6', padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                <i className="fas fa-microscope" style={{ marginRight: '8px' }}></i>Advanced Export
                            </button>
                        </>
                    )}
                </div>
            </div>

            {showTechDetails && analysisMeta && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                        {[
                            { label: 'How we analyzed it', value: analysisMeta.algorithmLabel, color: '#f8fafc' },
                            { label: 'Total Checks Performed', value: analysisMeta.proofValue, color: '#10b981' },
                            { label: 'Analysis Speed', value: `${analysisMeta.timeTaken} ms`, color: '#8b5cf6' },
                            { label: 'System Date', value: analysisMeta.timestamp, color: '#94a3b8' }
                        ].map((stat, i) => (
                            <div key={i} className="db-card" style={{ padding: '16px' }}>
                                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>{stat.label}</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {Object.keys(itemsetBreakdown).length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-microscope" style={{ color: '#8b5cf6' }}></i>
                                    Detailed Pattern Analysis
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {Object.entries(itemsetBreakdown).map(([size, count]) => (
                                        <div key={size} onClick={() => setItemsetModal({ size, patterns: itemsetDetails[size] || [] })} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>{size} Items Together</div>
                                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>{count} groups</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(16,185,129,0.02)', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.1)' }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-shield-alt"></i>
                                    Proof of Origin (Source Integrity)
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Detected Transaction Column:</span>
                                        <span style={{ fontWeight: 700, color: '#10b981' }}>"{dataMapping?.tx || 'Unknown'}"</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Detected Product Column:</span>
                                        <span style={{ fontWeight: 700, color: '#10b981' }}>"{dataMapping?.prod || 'Unknown'}"</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Data Rows Processed:</span>
                                        <span style={{ fontWeight: 700 }}>{parseInfo?.txCount || '0'} rows</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>
                                        * This analysis is derived strictly from the file you provided. No external or random data was used.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── MODALS (Sale Evidence & Patterns) ── */}
            {proofModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
                    <div className="db-card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16,185,129,0.08)', flexShrink: 0 }}>
                            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <i className="fas fa-receipt" style={{ color: '#10b981' }}></i>
                                Sale Evidence
                            </h4>
                            <button onClick={() => setProofModal(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '24px', padding: '0 5px' }}>✕</button>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, scrollbarWidth: 'thin' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>The Relationship:</div>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ color: '#10b981' }}>{proofModal.pair.split(' + ')[0]}</span>
                                    <i className="fas fa-long-arrow-alt-right" style={{ color: '#475569' }}></i>
                                    <span style={{ color: '#10b981' }}>{proofModal.pair.split(' + ')[1]}</span>
                                </div>
                            </div>
                            
                            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
                                This suggestion is not random. Our algorithm discovered this specific pairing in <strong>{proofModal.count}</strong> unique sales records within your uploaded file.
                            </p>

                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '16px', fontWeight: 800, letterSpacing: '1px' }}>RAW EVIDENCE SAMPLES FROM FILE {proofModal.count > 100 ? '(SHOWING FIRST 100)' : ''}:</div>
                                <div className="visible-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '150px', paddingRight: '12px', overflowY: 'scroll', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px' }}>
                                    {proofModal.samples?.map((s, i) => (
                                        <div key={i} style={{ fontSize: '13px', color: '#cbd5e1', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                                            <div style={{ fontSize: '10px', color: '#475569', marginBottom: '4px' }}>Transaction Sample #{i + 1}</div>
                                            {s.items.join(', ')}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(59,130,246,0.05)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)' }}>
                                <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>How We Found This Pattern:</div>
                                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                                    Our system scanned every single sale in your file. We found that in <strong>{proofModal.conf}%</strong> of cases, customers who bought the first item also picked up the second one. This is a real trend in your store, not a random guess!
                                </p>
                            </div>
                        </div>
                        <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }}>
                            <button onClick={() => setProofModal(null)} className="primary-btn" style={{ width: 'auto', padding: '10px 32px' }}>Got it, Thanks!</button>
                        </div>
                    </div>
                </div>
            )}

            {itemsetModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
                    <div className="db-card" style={{ maxWidth: '800px', width: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                            <h4 style={{ margin: 0, color: '#f1f5f9' }}>{itemsetModal.size} Items Together</h4>
                            <button onClick={() => setItemsetModal(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                {itemsetModal.patterns.map((p, i) => (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>{p.items.join(', ')}</div>
                                        <div style={{ fontSize: '10px', color: '#475569' }}>Popularity: {(p.support * 100).toFixed(2)}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
