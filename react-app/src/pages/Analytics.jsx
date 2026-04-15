import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import '../dashboard.css';
import '../mining.css';

// ── MINING ENGINE INTEGRATION (PYTHON BACKEND) ─────────────────
// Core ARM logic removed from frontend and migrated to Python/MLxtend 
// for industrial-grade performance and research paper alignment.
const API_URL = "http://localhost:8000";

// ── Helpers ──────────────────────────────────────────────────
function loadMining() {
    try {
        const raw = localStorage.getItem('cobuy_mining_results');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

const PALETTE = ['#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#ef4444', '#3b82f6', '#a3e635'];

// ── Lightweight SVG Arc Diagram ────────────────────────────────
function ArcDiagram({ products, pairs }) {
    const W = 900, H = 280, MARGIN = 60;
    const nodeY = H - 60;
    const n = Math.min(products.length, 14);
    const items = products.slice(0, n);

    if (!items.length) return (
        <div className="empty-chart-state" style={{ position: 'relative', height: '280px' }}>
            <i className="fas fa-project-diagram"></i>
            <span>Upload sales data to populate the network</span>
        </div>
    );

    const step = (W - MARGIN * 2) / Math.max(n - 1, 1);
    const positions = items.map((p, i) => ({
        ...p,
        x: MARGIN + i * step,
        y: nodeY,
        r: Math.max(6, Math.min(18, (p.count / (items[0]?.count || 1)) * 16 + 5)),
        color: PALETTE[i % PALETTE.length],
    }));

    const arcs = (pairs || []).slice(0, 8).map((pair, i) => {
        const [aName, bName] = (pair.pair || "").split(' + ');
        if (!aName || !bName) return null;
        const a = positions.find(p => p.name.startsWith(aName.slice(0, 6)) || aName.startsWith(p.name.slice(0, 6)));
        const b = positions.find(p => p.name.startsWith(bName.slice(0, 6)) || bName.startsWith(p.name.slice(0, 6)));
        if (!a || !b || a.x === b.x) return null;
        const cx = (a.x + b.x) / 2;
        const span = Math.abs(a.x - b.x);
        const arcH = Math.min(span * 0.55, nodeY - 30);
        const cy = nodeY - arcH;
        return { a, b, cx, cy, conf: pair.conf, color: PALETTE[i % PALETTE.length] };
    }).filter(Boolean);

    const [hovered, setHovered] = useState(null);

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }}>
                {[...Array(5)].map((_, i) => (
                    <line key={i} x1={MARGIN} y1={nodeY - i * 50} x2={W - MARGIN} y2={nodeY - i * 50}
                        stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                ))}
                {arcs.map((arc, i) => {
                    const isH = hovered === i;
                    return (
                        <g key={i}>
                            <path
                                d={`M ${arc.a.x} ${arc.a.y} Q ${arc.cx} ${arc.cy} ${arc.b.x} ${arc.b.y}`}
                                fill="none"
                                stroke={arc.color}
                                strokeWidth={isH ? 3 : 1.5}
                                strokeOpacity={isH ? 1 : 0.4}
                                strokeDasharray={isH ? '0' : '4 3'}
                                style={{ transition: 'stroke-opacity 0.2s, stroke-width 0.2s', cursor: 'pointer' }}
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() => setHovered(null)}
                            />
                            {isH && (
                                <text x={arc.cx} y={arc.cy - 12} textAnchor="middle" fill={arc.color} fontSize="13" fontWeight="800" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}>
                                    {arc.conf}% Confidence
                                </text>
                            )}
                        </g>
                    );
                })}
                <line x1={MARGIN - 10} y1={nodeY} x2={W - MARGIN + 10} y2={nodeY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                {positions.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r={p.r + 6} fill={p.color} fillOpacity="0.08" />
                        <circle cx={p.x} cy={p.y} r={p.r} fill={p.color} fillOpacity="0.9" stroke="#0b1120" strokeWidth="2" />
                        <text x={p.x} y={p.y + p.r + 14} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500" style={{ userSelect: 'none' }}>
                            {p.name.length > 15 ? p.name.slice(0, 12) + '…' : p.name}
                        </text>
                        <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800" style={{ userSelect: 'none' }}>
                            {p.count}
                        </text>
                    </g>
                ))}
            </svg>

            <div style={{ textAlign: 'center', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                Hover over any arc to see the association confidence · Nodes sized by sales volume
            </div>
        </div>
    );
}

// ── Component ──────────────────────────────────────────────────
export default function Analytics() {
    const confChartRef = useRef(null);
    const supportChartRef = useRef(null);
    const confChart = useRef(null);
    const supportChart = useRef(null);
    const fileInputRef = useRef(null);

    const [miningData, setMiningData] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [fileName, setFileName] = useState('No file chosen');
    const [rawFile, setRawFile] = useState(null);
    const [parseInfo, setParseInfo] = useState(null);
    const [analysisMeta, setAnalysisMeta] = useState(null);
    const [itemsetBreakdown, setItemsetBreakdown] = useState({});
    const [itemsetDetails, setItemsetDetails] = useState({}); // Stores actual patterns
    const [itemsetModal, setItemsetModal] = useState(null); // Controls the pattern drill-down modal
    const [proofModal, setProofModal] = useState(null);
    const [engineStatus, setEngineStatus] = useState("Checking...");
    const [dataMapping, setDataMapping] = useState(null);
    const [algorithm, setAlgorithm] = useState('fp-growth');

    useEffect(() => {
        const saved = loadMining();
        if (saved) {
            setMiningData(saved);
            if (saved.meta) setAnalysisMeta(saved.meta);
            if (saved.breakdown) setItemsetBreakdown(saved.breakdown);
            if (saved.itemset_details) setItemsetDetails(saved.itemset_details);
        }

        // Check Backend Health
        fetch(`${API_URL}/health`)
            .then(res => res.json())
            .then(data => setEngineStatus(data.status))
            .catch(() => setEngineStatus("Offline"));
    }, []);

    useEffect(() => {
        const saved = loadMining();
        if (saved) {
            setMiningData(saved);
            if (saved.meta) setAnalysisMeta(saved.meta);
            if (saved.breakdown) setItemsetBreakdown(saved.breakdown);
            if (saved.itemset_details) setItemsetDetails(saved.itemset_details);
        }
    }, []);

    // ── Charts ─────────────────────────────────────────────────
    useEffect(() => {
        if (!confChartRef.current || !miningData?.topPairs?.length) return;
        if (confChart.current) { confChart.current.destroy(); confChart.current = null; }

        confChart.current = new Chart(confChartRef.current, {
            type: 'bar',
            data: {
                labels: miningData.topPairs.map(p => p.pair),
                datasets: [{
                    label: 'Confidence %',
                    data: miningData.topPairs.map(p => p.conf),
                    backgroundColor: miningData.topPairs.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'),
                    borderColor: miningData.topPairs.map((_, i) => PALETTE[i % PALETTE.length]),
                    borderWidth: 1, borderRadius: 6,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b' } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569' }, max: 100, title: { display: true, text: 'CONFIDENCE PERCENTAGE (%)', color: '#64748b', font: { size: 10, weight: 700 } } },
                    y: { grid: { display: false }, ticks: { color: '#e2e8f0' }, title: { display: true, text: 'RULE PAIRS', color: '#64748b', font: { size: 10, weight: 700 } } }
                }
            }
        });
        return () => { if (confChart.current) { confChart.current.destroy(); } };
    }, [miningData]);

    useEffect(() => {
        if (!supportChartRef.current || !miningData?.topProducts?.length) return;
        if (supportChart.current) { supportChart.current.destroy(); supportChart.current = null; }

        const top = miningData.topProducts.slice(0, 10);
        const maxCount = top[0]?.count || 1;

        supportChart.current = new Chart(supportChartRef.current, {
            type: 'bubble',
            data: {
                datasets: top.map((p, i) => ({
                    label: p.name,
                    data: [{ x: i + 1, y: p.count, r: Math.max(6, (p.count / maxCount) * 28) }],
                    backgroundColor: PALETTE[i % PALETTE.length] + '88',
                    borderColor: PALETTE[i % PALETTE.length],
                    borderWidth: 2,
                }))
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b' } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', stepSize: 1 }, title: { display: true, text: 'TOP PRODUCT RANK', color: '#64748b', font: { size: 10, weight: 700 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569' }, title: { display: true, text: 'TOTAL SALES VOLUME (QTY)', color: '#64748b', font: { size: 10, weight: 700 } } }
                }
            }
        });
        return () => { if (supportChart.current) { supportChart.current.destroy(); } };
    }, [miningData]);

    // ── Handlers ───────────────────────────────────────────────
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileName(file.name);
        setRawFile(file);

        // Pre-parse locally just for UI feedback (Ready: X tx)
        // Pre-parse locally for UI feedback (Ready: X tx) - use a sample for huge files to avoid main-thread lock
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target.result;
                // Only parse headers and first few rows if the file is massive
                const workbook = XLSX.read(data, { type: 'binary', sheetRows: file.size > 2 * 1024 * 1024 ? 100 : undefined });
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

                if (jsonData.length === 0) return;

                let txIdKey = Object.keys(jsonData[0] || {}).find(k => /transaction|invoice|order|id/i.test(k));
                const salesVolume = jsonData.length;

                if (txIdKey) {
                    const txSet = new Set(jsonData.map(r => r[txIdKey]).filter(Boolean));
                    setParseInfo({
                        txCount: file.size > 2 * 1024 * 1024 ? `~${txSet.size}+` : txSet.size,
                        rowCount: salesVolume,
                        productCount: '...'
                    });
                } else {
                    setParseInfo({
                        txCount: file.size > 2 * 1024 * 1024 ? `~${jsonData.length}+` : jsonData.length,
                        rowCount: salesVolume,
                        productCount: '...'
                    });
                }

                // ── SMART SCALE LOGIC (Switched to Transaction Count) ──
                let currentTxCount = 0;
                if (txIdKey) {
                    const txSet = new Set(jsonData.map(r => r[txIdKey]).filter(Boolean));
                    currentTxCount = txSet.size;
                } else {
                    currentTxCount = jsonData.length;
                }

                if (currentTxCount >= 500) {
                    setAlgorithm('fp-growth');
                } else if (currentTxCount <= 400) {
                    setAlgorithm('apriori');
                }
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

            // Read Global Settings from LocalStorage
            const storedSupport = localStorage.getItem('cobuy_min_support') || 1;
            const storedConfidence = localStorage.getItem('cobuy_min_confidence') || 10;

            // Hybrid Engine Control
            formData.append('algorithm', algorithm);
            formData.append('min_support', Number(storedSupport) / 100);
            formData.append('min_confidence', Number(storedConfidence) / 100);

            const response = await fetch(`${API_URL}/mine`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Backend Error");

            const data = await response.json();

            // ── SELF-HEALING DATA MAPPING ──────────────────────────────
            let topPairs = data.topPairs || data.rules || [];
            let topProducts = data.topProducts || [];

            if (topProducts.length === 0 && topPairs.length > 0) {
                // Optimized frequency builder
                const counts = new Map();
                for (let i = 0; i < topPairs.length; i++) {
                    const items = topPairs[i].antecedent.split(', ');
                    for (let j = 0; j < items.length; j++) {
                        const it = items[j];
                        counts.set(it, (counts.get(it) || 0) + 1);
                    }
                }
                topProducts = Array.from(counts.entries())
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);
            }

            const finalData = {
                ...data,
                topPairs,
                topProducts,
                analysedAt: new Date().toISOString(),
                meta: {
                    ...data.meta,
                    timestamp: new Date().toLocaleString(),
                    algorithmLabel: data.meta.algorithm,
                    proofLabel: data.meta.algorithm === 'Apriori' ? 'Candidates Scanned' : 'FP-Tree Nodes',
                    proofValue: data.meta.itemset_count,
                    timeTaken: data.meta.time_taken
                }
            };

            setMiningData(finalData);
            setAnalysisMeta(finalData.meta);
            setItemsetBreakdown(data.breakdown || {});
            setItemsetDetails(data.itemset_details || {});
            localStorage.setItem('cobuy_mining_results', JSON.stringify(finalData));

            if (data.stats) {
                setParseInfo({ txCount: data.stats.unique_tx, productCount: data.stats.unique_products });
            }
            if (data.mapping) {
                setDataMapping(data.mapping);
            }
        } catch (err) {
            alert(`Mining Failed: ${err.message}. Ensure Python server is running.`);
        } finally {
            setIsRunning(false);
        }
    };


    const exportAll = () => {
        const lines = ["Analytics Report", `Generated: ${new Date().toLocaleString()}`, "", "Top Products", "Rank,Product,Sold"];
        miningData.topProducts.forEach((p, i) => lines.push(`${i + 1},"${p.name}",${p.count}`));
        lines.push("", "Associations", "Pair,Confidence %,Support");
        miningData.topPairs.forEach(p => lines.push(`"${p.pair}",${p.conf}%,${p.count}`));

        const blob = new Blob([lines.join("\n")], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'analytics_report.csv'; a.click();
    };

    const exportRapidMiner = () => {
        // RapidMiner typically expects a Transaction ID followed by items
        const raw = miningData?.topPairs.map(p => {
            const [a, b] = p.pair.split(' + ');
            return `TX_ID,${a},${b}`;
        }).join('\n');

        const blob = new Blob([`Transaction,Item1,Item2\n${raw}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'rapidminer_validation.csv'; a.click();
    };

    const noData = !miningData;

    return (
        <div className="db-body">
            {/* ── Header / Upload ── */}
            <div className="db-card" style={{ marginBottom: '24px', border: '1px dashed rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', color: '#10b981' }}>Data Import & Mining</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Upload sales data (.xlsx, .csv) to generate real-time product association insights.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
                            background: engineStatus === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${engineStatus === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            borderRadius: '10px', fontSize: '11px', color: engineStatus === 'Active' ? '#10b981' : '#ef4444', fontWeight: 600
                        }}>
                            <i className={engineStatus === 'Active' ? "fas fa-check-circle" : "fas fa-exclamation-triangle"}></i> Python Engine: {engineStatus}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".xlsx,.xls,.csv" />
                        <button className="file-btn" onClick={() => fileInputRef.current.click()} style={{ padding: '8px 16px' }}>
                            <i className="fas fa-file-excel" style={{ marginRight: '8px' }}></i>{parseInfo ? 'Change File' : 'Select Data File'}
                        </button>
                        {fileName !== 'No file chosen' && <span style={{ fontSize: '12px', color: '#64748b' }}>{fileName.length > 20 ? fileName.slice(0, 17) + '...' : fileName}</span>}
                        <button className="primary-btn pulse" onClick={runAnalysis} disabled={isRunning || !rawFile || engineStatus !== 'Active'}
                            style={{ width: 'auto', padding: '8px 24px', fontSize: '14px', borderRadius: '8px', opacity: engineStatus === 'Active' ? 1 : 0.5 }}>
                            {isRunning ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Analyzing...</> : 'Run Analysis'}
                        </button>
                    </div>
                </div>

                {parseInfo && (
                    <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '10px', fontSize: '12px', color: '#10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <span><i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i>Ready: {parseInfo.txCount} transactions</span>
                            <span><i className="fas fa-tags" style={{ marginRight: '6px' }}></i>{parseInfo.productCount} products found</span>
                        </div>
                        {dataMapping && (
                            <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>
                                <i className="fas fa-link" style={{ marginRight: '6px', color: '#8b5cf6' }}></i>
                                Mapped: <span style={{ color: '#f8fafc' }}>{dataMapping.tx}</span> <i className="fas fa-arrow-right" style={{ fontSize: '10px', margin: '0 4px' }}></i> <span style={{ color: '#f8fafc' }}>{dataMapping.prod}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── CHART EXPLANATION banner ── */}
            <div className="db-card" style={{ marginBottom: '24px', background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(59,130,246,0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#3b82f6' }}>
                        <i className="fas fa-info-circle"></i>
                    </div>
                    <div>
                        <h5 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '15px' }}>Understanding the Analytics</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 30px' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                                <strong style={{ color: '#3b82f6' }}>Circles (Nodes):</strong> Represent individual products. The <strong style={{color:'#f8fafc'}}>size</strong> reflects total sales volume, and the <strong style={{color:'#f8fafc'}}>number</strong> inside shows exactly how many times it was sold.
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                                <strong style={{ color: '#10b981' }}>Arcs (Arrows):</strong> Represent "bought together" associations. Thick or bright arcs mean higher <strong style={{color:'#f8fafc'}}>confidence</strong>—meaning customers who bought product A are very likely to buy product B.
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                                <strong style={{ color: '#8b5cf6' }}>Confidence Bar Chart:</strong> Ranks discovered associations by their <strong style={{color:'#f8fafc'}}>confidence percentage</strong>—the likelihood that buying one product leads to buying another.
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                                <strong style={{ color: '#06b6d4' }}>Volume Bubbles:</strong> Each bubble is a product. <strong style={{color:'#f8fafc'}}>Bigger bubbles</strong> = more sales. Shows which products are your top sellers at a glance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Visualizations ── */}
            <div className="db-card" style={{ marginBottom: '24px' }}>
                <div className="db-card-header">
                    <div>
                        <div className="db-card-title"><i className="fas fa-bezier-curve" style={{ color: '#10b981', marginRight: '8px' }}></i>Association Arc Diagram</div>
                        <div className="db-card-sub">Top associations visualized as connections between products.</div>
                    </div>
                </div>
                <ArcDiagram products={miningData?.topProducts ?? []} pairs={miningData?.topPairs ?? []} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div className="db-card">
                    <div className="db-card-header">
                        <div className="db-card-title"><i className="fas fa-chart-line" style={{ color: '#8b5cf6', marginRight: '8px' }}></i>Association Confidence</div>
                    </div>
                    <div style={{ height: '220px', position: 'relative' }}>
                        {noData && <div className="empty-chart-state"><span>Run mining to see data</span></div>}
                        <canvas ref={confChartRef}></canvas>
                    </div>
                </div>
                <div className="db-card">
                    <div className="db-card-header">
                        <div className="db-card-title"><i className="fas fa-chart-pie" style={{ color: '#06b6d4', marginRight: '8px' }}></i>Product Volume Bubble</div>
                    </div>
                    <div style={{ height: '220px', position: 'relative' }}>
                        {noData && <div className="empty-chart-state"><span>Run mining to see data</span></div>}
                        <canvas ref={supportChartRef}></canvas>
                    </div>
                    {/* Node Legend */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px', marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Node Size Legend</div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            {[
                                { size: 28, color: '#10b981', label: 'Largest = highest sales' },
                                { size: 18, color: '#8b5cf6', label: 'Medium = moderate sellers' },
                                { size: 10, color: '#f59e0b', label: 'Small = niche items' },
                            ].map(({ size, color, label }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: color + '25', border: `2px solid ${color}`, flexShrink: 0 }}></div>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Algorithm Proof (Itemsets) ── */}
            {Object.keys(itemsetBreakdown).length > 0 && (
                <div style={{ marginBottom: '24px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <i className="fas fa-microscope" style={{ color: '#10b981', fontSize: '18px' }}></i>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>Intermediate Discovery Steps (Algorithm Proof)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {Object.entries(itemsetBreakdown).map(([size, count]) => (
                            <div 
                                key={size} 
                                onClick={() => setItemsetModal({ size, patterns: itemsetDetails[size] || [] })}
                                style={{ 
                                    background: 'rgba(255,255,255,0.04)', padding: '10px 16px', borderRadius: '10px', 
                                    border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                className="proof-box-hover"
                            >
                                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>{size}-Itemsets</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{count} patterns <i className="fas fa-external-link-alt" style={{ fontSize: '10px', marginLeft: '6px', opacity: 0.5 }}></i></div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#475569', fontStyle: 'italic' }}>
                        * These represent the raw patterns identified by {analysisMeta?.algorithmLabel || 'the engine'} before they are converted into business rules.
                    </div>
                </div>
            )}

            {/* ── Associations Table ── */}
            <div className="db-card">
                <div className="db-card-header" style={{ paddingBottom: '12px' }}>
                    <div className="db-card-title"><i className="fas fa-table" style={{ color: '#f59e0b', marginRight: '8px' }}></i>Smart Product Recommendations</div>
                    <div className="db-card-sub">Complete co-purchase rules from the mining engine</div>
                </div>
                <div className="scrollable-table-container">
                    <table className="db-table" style={{ position: 'relative' }}>
                        <thead>
                            <tr>
                                <th>When Customer Buys...</th>
                                <th>System Recommends...</th>
                                <th>Confidence</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(miningData?.topPairs ?? []).map((p, i) => (
                                <tr key={i}>
                                    <td style={{ color: '#f1f5f9', fontWeight: 600 }}>{p.pair.split(' + ')[0]}</td>
                                    <td style={{ color: '#94a3b8' }}>{p.pair.split(' + ')[1] || '...'}</td>
                                    <td>
                                        <span style={{ color: p.conf >= 50 ? '#10b981' : '#f59e0b', fontWeight: 700, background: (p.conf >= 50 ? '#10b981' : '#f59e0b') + '15', padding: '2px 8px', borderRadius: '4px' }}>
                                            {p.conf}%
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => setProofModal(p)} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                            View Proof
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {noData && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: '#334155' }}>
                                <i className="fas fa-search" style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}></i>
                                No associations discovered yet. Upload data to begin.
                            </td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Proof Modal ── */}
            {proofModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
                    <div className="db-card" style={{ maxWidth: '640px', width: '100%', animation: 'fadeIn 0.2s', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#f8fafc' }}>
                                <i className="fas fa-check-double" style={{ color: '#10b981', marginRight: '10px' }}></i>
                                Association Evidence
                            </h4>
                            <button onClick={() => setProofModal(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%' }}>✕</button>
                        </div>
                        <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
                            The pattern <strong>{proofModal.pair}</strong> was found in <strong>{proofModal.count}</strong> transactions.
                            Below are samples from your raw data providing proof of this association.
                        </p>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Raw Transaction Samples:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {proofModal.samples?.map((s, i) => (
                                    <div key={i} style={{ fontSize: '13px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <i className="fas fa-tag" style={{ marginRight: '10px', color: '#10b981', fontSize: '10px' }}></i>
                                        {s.items.join(', ')}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setProofModal(null)} className="primary-btn" style={{ marginTop: '24px', padding: '12px' }}>Dismiss Evidence</button>
                    </div>
                </div>
            )}

            {/* ── Pattern Drill-down Modal ── */}
            {itemsetModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
                    <div className="db-card" style={{ maxWidth: '800px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                                <h4 style={{ margin: 0, color: '#f1f5f9' }}>
                                    <i className="fas fa-cubes" style={{ color: '#10b981', marginRight: '10px' }}></i>
                                    {itemsetModal.size}-Itemset Patterns ({itemsetModal.patterns.length} found)
                                </h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Raw patterns discovered by {analysisMeta?.algorithmLabel || 'the engine'} at this complexity level.</p>
                                <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)', display: 'inline-block' }}>
                                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}><i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>What is Support?</span>
                                    <span style={{ fontSize: '11px', color: '#cbd5e1', marginLeft: '6px' }}>It indicates the percentage of all transactions that include this exact combination of items.</span>
                                </div>
                            </div>
                            <button onClick={() => setItemsetModal(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px' }}>✕</button>
                        </div>
                        
                        <div className="scrollable-table-container" style={{ flex: 1, maxHeight: 'none', border: 'none', borderRadius: 0, padding: '24px 32px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                {itemsetModal.patterns.map((p, i) => (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '10px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                                            {p.items.map((item, ii) => (
                                                <span key={ii} style={{ fontSize: '11px', background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support: {(p.support * 100).toFixed(2)}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '16px 32px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#475569' }}>Showing all {itemsetModal.patterns.length} patterns for {itemsetModal.size}-itemset group</span>
                            <button className="primary-btn" onClick={() => setItemsetModal(null)} style={{ width: 'auto', padding: '8px 20px' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
