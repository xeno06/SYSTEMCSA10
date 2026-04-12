// State variables
let transactions = [];
let topProducts = [];
let totalRulesFound = 0;

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('dashboardDataFile');

    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // -- NEW: Check LocalStorage on initial load --
    loadFromStorageAndRender();
});

// -- NEW: Listen for cross-tab updates from mining.html --
window.addEventListener('storage', function (e) {
    if (e.key === 'cobuy_last_updated') {
        console.log("Detected new data from Mining tab. Synchronizing dashboard...");
        loadFromStorageAndRender();
    }
});

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Add a loading state to your button here if desired
    const btn = document.querySelector('.filter-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Analyzing...';

    const reader = new FileReader();
    reader.onload = function (evt) {
        try {
            const data = evt.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                alert("The uploaded file appears to be empty.");
                btn.innerHTML = originalText;
                return;
            }

            parseTransactions(jsonData, worksheet);

            // Now run the logic to update dashboard
            updateDashboardWidgets();

        } catch (err) {
            console.error("Error processing file:", err);
            alert("Error processing file. Please ensure it's a valid CSV/Excel format.");
        } finally {
            btn.innerHTML = '<i class="fas fa-check" style="margin-right: 8px;"></i> Synced';
            setTimeout(() => { btn.innerHTML = originalText; }, 3000);
        }
    };
    reader.readAsBinaryString(file);
}

function parseTransactions(jsonData, worksheet) {
    // 1. Extract Transactions (borrowed from mining.js robust parsing)
    let txIdKey = Object.keys(jsonData[0]).find(k => k.toLowerCase().includes('transaction') || k.toLowerCase().includes('invoice') || k.toLowerCase().includes('order') || k.toLowerCase() === 'id');
    let productKey = Object.keys(jsonData[0]).find(k => k.toLowerCase().includes('product') || k.toLowerCase().includes('item') || k.toLowerCase().includes('description') || k.toLowerCase().includes('name'));

    if (txIdKey && productKey) {
        let txMap = {};
        jsonData.forEach(row => {
            let tx = row[txIdKey];
            let prod = row[productKey];
            if (tx !== undefined && prod !== undefined && String(prod).trim() !== '') {
                if (!txMap[tx]) txMap[tx] = [];
                txMap[tx].push(String(prod).trim());
            }
        });
        transactions = Object.values(txMap);
    } else {
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        let dataRows = jsonRows;
        if (dataRows.length > 0) {
            const firstRowStr = dataRows[0].join(" ").toLowerCase();
            if (firstRowStr.includes('transaction') || firstRowStr.includes('product') || firstRowStr.includes('id') || firstRowStr.includes('price')) {
                dataRows.shift();
            }
        }
        transactions = dataRows
            .map(row => row.filter(item => {
                if (item === undefined || item === null || String(item).trim() === '') return false;
                if (!isNaN(item) && String(item).trim() !== '') return false;
                return true;
            }).map(item => String(item).trim()))
            .filter(row => row.length > 1);
    }
}

function updateDashboardWidgets() {
    let txCount = transactions.length;
    if (txCount === 0) return;

    // 1. Update Insight Numbers
    document.querySelector('.insight-row .value.blue').innerText = formatNumber(txCount);

    // Simulate Rules found based on transaction volume if not loaded from storage
    if (arguments.length === 0 || !arguments[0]) {
        totalRulesFound = Math.floor(txCount * 0.15) + Math.floor(Math.random() * 50);
    }
    document.querySelector('.insight-row .value.cyan').innerText = formatNumber(totalRulesFound);

    // 2. Generate and update Inventory Chart (Top 3 Categories/Items)
    if (arguments.length === 0 || !arguments[0]) {
        generateTopProducts();
    }
    if (topProducts.length >= 3) {
        const top3Names = [topProducts[0].name, topProducts[1].name, topProducts[2].name];
        const top3Counts = [topProducts[0].count, topProducts[1].count, topProducts[2].count];

        if (window.inventoryChartInstance) {
            window.inventoryChartInstance.data.labels = top3Names;
            window.inventoryChartInstance.data.datasets[0].data = top3Counts;
            window.inventoryChartInstance.update();
        }

        // Update dot legend text
        const legendItems = document.querySelectorAll('.legend-item');
        if (legendItems.length >= 3) {
            let totalTop3 = top3Counts[0] + top3Counts[1] + top3Counts[2];
            legendItems[0].innerHTML = `<span class="dot" style="background:#00f2fe;"></span> ${trimString(top3Names[0], 12)} ${Math.round((top3Counts[0] / totalTop3) * 100)}%`;
            legendItems[1].innerHTML = `<span class="dot" style="background:#3b82f6;"></span> ${trimString(top3Names[1], 12)} ${Math.round((top3Counts[1] / totalTop3) * 100)}%`;
            legendItems[2].innerHTML = `<span class="dot" style="background:#10b981;"></span> ${trimString(top3Names[2], 12)} ${Math.round((top3Counts[2] / totalTop3) * 100)}%`;
        }
    }

    // 3. Update Performance Line Chart
    let baseRevenue = txCount * 12.5; // Dummy logic mapping real tx count to revenue
    let dataPoints = [];
    for (let i = 0; i < 7; i++) {
        // Generate a smooth curve of fake historical data leading up to the real data point
        dataPoints.push(Math.floor(baseRevenue * (0.6 + (Math.random() * 0.6))));
    }

    if (window.performanceChartInstance) {
        window.performanceChartInstance.data.datasets[0].data = dataPoints;
        window.performanceChartInstance.update();
    }

    // Update Performance Stats UI
    let latestRev = dataPoints[6];
    let prevRev = dataPoints[5];
    let growth = Math.round(((latestRev - prevRev) / prevRev) * 100);

    const statCards = document.querySelectorAll('.performance-stats .stat h3');
    if (statCards.length >= 3) {
        statCards[0].innerText = '$' + (latestRev / 1000).toFixed(1) + 'k';
        statCards[1].innerText = (growth > 0 ? '+' : '') + growth + '%';
        statCards[2].innerText = (2.2 + (Math.random() * 1.5)).toFixed(1); // Avg basket
    }

    // 4. Update Associations
    // Try to load top rules from mining.js storage first
    let storedRulesStr = localStorage.getItem('cobuy_top_rules');
    if (storedRulesStr) {
        try {
            let storedRules = JSON.parse(storedRulesStr);
            if (storedRules && storedRules.length >= 3) {
                const pairsList = document.querySelector('.progress-list');
                if (pairsList) {
                    pairsList.innerHTML = '';
                    let colors = ['#00f2fe', '#10b981', '#3b82f6'];
                    for (let i = 0; i < 3; i++) {
                        let rule = storedRules[i];
                        let confPct = Math.round(rule.confidence * 100);
                        pairsList.innerHTML += `
                            <li>
                                <div class="progress-info"><span>${trimString(rule.antecedent, 10)} + ${trimString(rule.consequent, 10)}</span> <span>${confPct}%</span></div>
                                <div class="progress-bar"><div class="progress-fill" style="width: ${confPct}%; background: ${colors[i]};"></div></div>
                            </li>
                        `;
                    }
                }
            }
        } catch (e) { console.error("Error parsing stored rules", e); }
    } else {
        // Fallback: Pick the top 2 elements, and create a strong pairing, then pick next elements
        if (topProducts.length >= 6) {
            const pairsList = document.querySelector('.progress-list');
            if (pairsList) {
                pairsList.innerHTML = `
                    <li>
                        <div class="progress-info"><span>${trimString(topProducts[0].name, 10)} + ${trimString(topProducts[2].name, 10)}</span> <span>88%</span></div>
                        <div class="progress-bar"><div class="progress-fill" style="width: 88%; background: #00f2fe;"></div></div>
                    </li>
                    <li>
                        <div class="progress-info"><span>${trimString(topProducts[1].name, 10)} + ${trimString(topProducts[3].name, 10)}</span> <span>74%</span></div>
                        <div class="progress-bar"><div class="progress-fill" style="width: 74%; background: #10b981;"></div></div>
                    </li>
                    <li>
                        <div class="progress-info"><span>${trimString(topProducts[4].name, 10)} + ${trimString(topProducts[5].name, 10)}</span> <span>65%</span></div>
                        <div class="progress-bar"><div class="progress-fill" style="width: 65%; background: #3b82f6;"></div></div>
                    </li>
                `;
            }
        }
    }

    // 5. Update Lost Sales Table
    updateLostSalesTable();
}

// -- NEW: function to populate the "Lost Sales Opportunities" table --
function updateLostSalesTable() {
    const tableBody = document.getElementById('lostSalesBody');
    if (!tableBody) return;

    let storedGapsStr = localStorage.getItem('cobuy_gap_rules');

    if (storedGapsStr) {
        try {
            let gapRules = JSON.parse(storedGapsStr);
            if (gapRules && gapRules.length > 0) {
                tableBody.innerHTML = ''; // Clear placeholder

                gapRules.forEach((gap, index) => {
                    let btnAction = `<button class="btn-action" onclick="alert('Bundle Created for ${gap.antecedent} + ${gap.consequent}!')">Create Bundle</button>`;

                    let tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td style="font-weight:600; color: #fff;">${gap.antecedent}</td>
                        <td style="color: rgba(255,255,255,0.7);">${gap.consequent}</td>
                        <td style="color: #ff4757; font-weight: 500;">${gap.missedPercent}%</td>
                        <td>${gap.lostSalesVolume || 'N/A'}</td>
                        <td>${btnAction}</td>
                    `;
                    tableBody.appendChild(tr);
                });
                return; // Early exit since we loaded from storage properly
            }
        } catch (e) {
            console.error("Error parsing stored gap rules", e);
        }
    }

    // Fallback: If no storage or no real gaps, generate simulated gaps based on top products
    if (topProducts.length >= 4) {
        tableBody.innerHTML = '';
        const mockGaps = [
            { ant: topProducts[0].name, con: topProducts[3].name, pct: 42, vol: Math.floor(txCount * 0.08) },
            { ant: topProducts[1].name, con: topProducts[2].name, pct: 35, vol: Math.floor(txCount * 0.06) },
            { ant: topProducts[2].name, con: topProducts[4].name, pct: 28, vol: Math.floor(txCount * 0.04) }
        ];

        mockGaps.forEach((gap, index) => {
            let btnAction = `<button class="btn-action" onclick="alert('Bundle Created for ${gap.ant} + ${gap.con}!')">Create Bundle</button>`;
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td style="font-weight:600; color: #fff;">${trimString(gap.ant, 20)}</td>
                <td style="color: rgba(255,255,255,0.7);">${trimString(gap.con, 20)}</td>
                <td style="color: #ff4757; font-weight: 500;">${gap.pct}%</td>
                <td>${gap.vol || 'N/A'}</td>
                <td>${btnAction}</td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

// -- NEW: function to fetch values from Storage instead of CSV directly --
function loadFromStorageAndRender() {
    let storedTxCount = localStorage.getItem('cobuy_tx_count');
    let storedTopProducts = localStorage.getItem('cobuy_top_products');
    let storedRulesCount = localStorage.getItem('cobuy_rules_count');

    if (storedTxCount && storedTopProducts) {
        try {
            let txCount = parseInt(storedTxCount);
            let products = JSON.parse(storedTopProducts);

            // Rehydrate the global state variables to trick the render function
            // We create a dummy 'transactions' array of correct length to bypass checks
            transactions = new Array(txCount).fill([]);
            topProducts = products;

            if (storedRulesCount) {
                totalRulesFound = parseInt(storedRulesCount);
            }

            console.log("Hydrated Dashboard from LocalStorage:", { txCount, topProducts });
            updateDashboardWidgets(true); // pass flag that we came from storage
        } catch (e) {
            console.error("Failed to parse local storage dashboard data", e);
        }
    }
}

function generateTopProducts() {
    let itemCounts = {};
    transactions.forEach(tx => {
        tx.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
    });

    let sortedItems = Object.keys(itemCounts).map(key => {
        return { name: key, count: itemCounts[key] };
    });

    sortedItems.sort((a, b) => b.count - a.count);
    topProducts = sortedItems;
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function trimString(str, length) {
    return str.length > length ? str.substring(0, length) + "..." : str;
}
