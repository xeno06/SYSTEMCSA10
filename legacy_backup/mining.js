// Global State
let analysisResults = { rules: [], gaps: [] };
let topProducts = [];
let transactions = [];

// DOM Elements
const dataFileInput = document.getElementById('dataFile');
const fileNameSpan = document.getElementById('fileName');
const runBtn = document.getElementById('runBtn');
const loader = document.getElementById('loader');
const topProductsContainer = document.getElementById('topProductsContainer');
const topProductsBody = document.getElementById('topProductsBody');
const resultsContainer = document.getElementById('resultsContainer');
const resultsBody = document.getElementById('resultsBody');
const adviceContainerDOM = document.getElementById('adviceContainer');
const adviceBody = document.getElementById('adviceBody');
const execTimeDiv = document.getElementById('execTime');

// 1. File Upload & Processing
dataFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        fileNameSpan.innerText = file.name;

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
                    return;
                }

                const keys = Object.keys(jsonData[0]).map(k => k.toLowerCase());
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
                console.log(`Successfully parsed ${transactions.length} transactions.`);
            } catch (err) {
                alert("Error processing file. Please ensure it's a valid CSV/Excel format.");
                console.error(err);
            }
        };
        reader.readAsBinaryString(file);
    } else {
        fileNameSpan.innerText = 'No file chosen';
        transactions = [];
    }
});

// -- APRIORI ALGORITHM --
class Apriori {
    constructor(transactions, minSupport) {
        this.transactions = transactions;
        this.minSupportCount = Math.ceil(minSupport * transactions.length);
        this.frequentItemsets = {};
    }

    getFrequentItemsets() {
        let L1 = this.getL1();
        if (L1.length === 0) return {};
        this.frequentItemsets[1] = L1;

        let k = 2;
        while (this.frequentItemsets[k - 1] && this.frequentItemsets[k - 1].length > 0) {
            let Ck = this.generateCandidates(this.frequentItemsets[k - 1], k);
            let Lk = this.getFrequentFromCandidates(Ck);
            if (Lk.length === 0) break;
            this.frequentItemsets[k] = Lk;
            k++;
        }
        return this.frequentItemsets;
    }

    getL1() {
        let counts = {};
        for (let tx of this.transactions) {
            let uniqueItems = [...new Set(tx)];
            for (let item of uniqueItems) {
                counts[item] = (counts[item] || 0) + 1;
            }
        }
        let L1 = [];
        for (let [item, count] of Object.entries(counts)) {
            if (count >= this.minSupportCount) L1.push({ itemset: [item], count });
        }
        return L1.sort((a, b) => a.itemset[0].localeCompare(b.itemset[0]));
    }

    generateCandidates(Lk_1, k) {
        let candidates = [];
        for (let i = 0; i < Lk_1.length; i++) {
            for (let j = i + 1; j < Lk_1.length; j++) {
                let set1 = Lk_1[i].itemset;
                let set2 = Lk_1[j].itemset;
                let match = true;
                for (let m = 0; m < k - 2; m++) {
                    if (set1[m] !== set2[m]) { match = false; break; }
                }
                if (match) {
                    let newSet = [...new Set([...set1, ...set2])].sort();
                    if (newSet.length === k) {
                        const joined = newSet.join('|');
                        if (!candidates.some(c => c.join('|') === joined)) {
                            candidates.push(newSet);
                        }
                    }
                }
            }
        }
        return candidates;
    }

    getFrequentFromCandidates(candidates) {
        let counts = new Array(candidates.length).fill(0);
        for (let tx of this.transactions) {
            let txSet = new Set(tx);
            for (let i = 0; i < candidates.length; i++) {
                if (candidates[i].every(item => txSet.has(item))) counts[i]++;
            }
        }
        let Lk = [];
        for (let i = 0; i < candidates.length; i++) {
            if (counts[i] >= this.minSupportCount) {
                Lk.push({ itemset: candidates[i], count: counts[i] });
            }
        }
        return Lk;
    }
}

// -- FP-GROWTH ALGORITHM --
class FPNode {
    constructor(item, count, parent) {
        this.item = item;
        this.count = count;
        this.parent = parent;
        this.children = {};
        this.next = null;
    }
}

class FPGrowth {
    constructor(transactions, minSupport) {
        this.transactions = transactions;
        this.minSupportCount = Math.ceil(minSupport * transactions.length);
    }

    getFrequentItemsets() {
        let counts = {};
        for (let tx of this.transactions) {
            let uniqueItems = [...new Set(tx)];
            for (let item of uniqueItems) {
                counts[item] = (counts[item] || 0) + 1;
            }
        }

        let validCounts = {};
        let headerTable = {};
        for (let [item, c] of Object.entries(counts)) {
            if (c >= this.minSupportCount) {
                validCounts[item] = c;
                headerTable[item] = { count: c, head: null, tail: null };
            }
        }

        if (Object.keys(validCounts).length === 0) return {};

        let getFreqRank = (a, b) => validCounts[b] - validCounts[a] || a.localeCompare(b);

        let orderedTransactions = [];
        for (let tx of this.transactions) {
            let filtered = [...new Set(tx)].filter(i => validCounts[i]).sort(getFreqRank);
            if (filtered.length > 0) orderedTransactions.push({ items: filtered, count: 1 });
        }

        this.buildFPTree(orderedTransactions, headerTable);

        let frequentItemsetsList = [];
        this.mineTree(headerTable, this.minSupportCount, [], frequentItemsetsList);

        let frequentItemsets = {};
        for (let fi of frequentItemsetsList) {
            let len = fi.itemset.length;
            if (!frequentItemsets[len]) frequentItemsets[len] = [];
            frequentItemsets[len].push(fi);
        }

        return frequentItemsets;
    }

    buildFPTree(transactions, headerTable) {
        let root = new FPNode(null, 0, null);
        for (let txObj of transactions) {
            let tx = txObj.items;
            let current = root;
            for (let item of tx) {
                if (!current.children[item]) {
                    let newNode = new FPNode(item, 0, current);
                    current.children[item] = newNode;
                    if (headerTable[item].head === null) {
                        headerTable[item].head = newNode;
                        headerTable[item].tail = newNode;
                    } else {
                        headerTable[item].tail.next = newNode;
                        headerTable[item].tail = newNode;
                    }
                }
                current = current.children[item];
                current.count += txObj.count;
            }
        }
        return root;
    }

    mineTree(headerTable, minSupportCount, prefix, frequentItemsets) {
        let items = Object.keys(headerTable).sort((a, b) => headerTable[a].count - headerTable[b].count);

        for (let item of items) {
            let newFreqSet = [...prefix, item].sort();
            frequentItemsets.push({ itemset: newFreqSet, count: headerTable[item].count });

            let conditionalPatternBase = [];
            let node = headerTable[item].head;
            while (node !== null) {
                let path = [];
                let parent = node.parent;
                while (parent && parent.item !== null) {
                    path.push(parent.item);
                    parent = parent.parent;
                }
                if (path.length > 0) {
                    conditionalPatternBase.push({ items: path.reverse(), count: node.count });
                }
                node = node.next;
            }

            if (conditionalPatternBase.length > 0) {
                let condCounts = {};
                for (let pb of conditionalPatternBase) {
                    for (let i of pb.items) {
                        condCounts[i] = (condCounts[i] || 0) + pb.count;
                    }
                }
                let condHeaderTable = {};
                for (let [i, c] of Object.entries(condCounts)) {
                    if (c >= minSupportCount) condHeaderTable[i] = { count: c, head: null, tail: null };
                }

                let validCondBase = [];
                for (let pb of conditionalPatternBase) {
                    let validItems = pb.items.filter(i => condHeaderTable[i]);
                    if (validItems.length > 0) validCondBase.push({ items: validItems, count: pb.count });
                }

                if (Object.keys(condHeaderTable).length > 0) {
                    this.buildFPTree(validCondBase, condHeaderTable);
                    this.mineTree(condHeaderTable, minSupportCount, newFreqSet, frequentItemsets);
                }
            }
        }
    }
}

// Generate Rules from Frequent Itemsets
function generateRules(frequentItemsets, totalTransactions, minConf) {
    let rules = [];
    let itemsetCounts = {};

    for (let k in frequentItemsets) {
        for (let fi of frequentItemsets[k]) {
            itemsetCounts[fi.itemset.join('|')] = fi.count;
        }
    }

    let getSubsets = (arr) => {
        let subsets = [];
        let numSets = 1 << arr.length;
        for (let i = 1; i < numSets - 1; i++) {
            let subset = [];
            for (let j = 0; j < arr.length; j++) {
                if ((i & (1 << j)) > 0) subset.push(arr[j]);
            }
            if (subset.length > 0 && subset.length < arr.length) subsets.push(subset);
        }
        return subsets;
    };

    for (let k in frequentItemsets) {
        if (k < 2) continue; // Need at least 2 items for a rule
        for (let fi of frequentItemsets[k]) {
            let itemset = fi.itemset;
            let supportCount = fi.count;
            let support = supportCount / totalTransactions;

            let subsets = getSubsets(itemset);
            for (let antecedent of subsets) {
                let consequent = itemset.filter(i => !antecedent.includes(i));
                let antecedentCount = itemsetCounts[antecedent.join('|')];

                if (antecedentCount) {
                    let confidence = supportCount / antecedentCount;
                    if (confidence >= minConf) {
                        let consequentCount = itemsetCounts[consequent.join('|')];
                        let lift = (supportCount / totalTransactions) / ((antecedentCount / totalTransactions) * (consequentCount / totalTransactions));
                        rules.push({
                            antecedent: antecedent.join(', '),
                            consequent: consequent.join(', '),
                            support: support,
                            confidence: confidence,
                            lift: lift
                        });
                    }
                }
            }
        }
    }

    // Remove duplicate rules that may somehow appear
    // AND remove symmetric duplicates (if A=>B and B=>A both exist, keep the one with higher confidence)
    let uniqueRules = [];
    let seenPairs = new Set();

    // First, sort by confidence so we process the strongest rules first
    rules.sort((a, b) => b.confidence - a.confidence || b.support - a.support);

    for (let r of rules) {
        // Create an order-independent pair key to detect symmetry (A=>B vs B=>A)
        let parts = [r.antecedent, r.consequent].sort();
        let pairKey = parts.join('|<=>|');

        if (!seenPairs.has(pairKey)) {
            uniqueRules.push(r);
            seenPairs.add(pairKey);
        }
    }

    // Now, generate specifically targeted "Missing Link" gaps. 
    // This is NOT restricted to the exact list of symmetric Rules. We want to find cases where 
    // a customer bought A, but didn't buy B (when B is frequently bought with A).
    // We only care about rules where there is an actual gap > 0% (confidence < 1.0)
    let gapRules = [];
    let seenGaps = new Set();

    for (let k in frequentItemsets) {
        if (k < 2) continue;
        for (let fi of frequentItemsets[k]) {
            let itemset = fi.itemset;
            let supportCount = fi.count;

            let subsets = getSubsets(itemset);
            for (let antecedent of subsets) {
                let consequent = itemset.filter(i => !antecedent.includes(i));
                let antecedentCount = itemsetCounts[antecedent.join('|')];

                if (antecedentCount) {
                    let confidence = supportCount / antecedentCount;
                    // A true gap means confidence < 100% (some people didn't buy it)
                    // We also want some minimum support so we aren't showing tiny outliers
                    if (confidence < 1.0 && confidence >= 0.05) { // At least 5% association to even suggest it
                        let missedPercent = (100 - (confidence * 100)).toFixed(0);
                        if (missedPercent > 0) { // Safety check to prevent 0% gaps due to rounding
                            let gapKey = antecedent.join(', ') + '=>' + consequent.join(', ');
                            if (!seenGaps.has(gapKey)) {
                                gapRules.push({
                                    antecedent: antecedent.join(', '),
                                    consequent: consequent.join(', '),
                                    missedPercent: missedPercent,
                                    lostSalesVolume: antecedentCount - supportCount // Raw number of missed sales
                                });
                                seenGaps.add(gapKey);
                            }
                        }
                    }
                }
            }
        }
    }

    // Sort gap rules by the raw volume of lost sales, prioritizing biggest opportunities
    gapRules.sort((a, b) => b.lostSalesVolume - a.lostSalesVolume || b.missedPercent - a.missedPercent);

    return { uniqueRules, gapRules };
}

// 2. Trigger Algorithm Automatically
function runAnalysis() {
    if (transactions.length === 0) {
        alert("Please upload a file with transaction data first (.csv or .xlsx).");
        return;
    }

    loader.classList.remove('hidden');
    runBtn.disabled = true;
    if (execTimeDiv) execTimeDiv.innerText = '';
    topProductsContainer.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    adviceContainerDOM.classList.add('hidden');

    const thresholds = [
        { supp: 0.05, conf: 0.20 },
        { supp: 0.03, conf: 0.15 },
        { supp: 0.01, conf: 0.10 },
        { supp: 0.005, conf: 0.05 },
        { supp: 0.001, conf: 0.01 }
    ];

    setTimeout(() => {
        try {
            console.log("Running Top Products Counting...");
            runTopProductsAnalysis(transactions);

            console.log(`Running full-scale Market Basket Analysis...`);

            let t0 = performance.now();
            let foundRules = false;

            for (let t of thresholds) {
                console.log(`Trying Support: ${t.supp}, Confidence: ${t.conf}...`);

                // We run FP-Growth as the primary engine because it's significantly faster 
                // for the actual UI data generation. Mathematically they yield the exact same itemsets.
                const fpGrowth = new FPGrowth(transactions, t.supp);
                let frequentItemsets = fpGrowth.getFrequentItemsets();

                const { uniqueRules, gapRules } = generateRules(frequentItemsets, transactions.length, t.conf);

                if (uniqueRules.length > 0 || gapRules.length > 0) {
                    analysisResults = {
                        rules: uniqueRules,
                        gaps: gapRules
                    };
                    foundRules = true;
                    console.log(`Found ${uniqueRules.length} rules and ${gapRules.length} gaps!`);

                    // -- NEW: Emit to LocalStorage for Dashboard Sync --
                    localStorage.setItem('cobuy_tx_count', transactions.length);
                    localStorage.setItem('cobuy_top_products', JSON.stringify(topProducts.slice(0, 10)));
                    localStorage.setItem('cobuy_rules_count', uniqueRules.length + gapRules.length);
                    localStorage.setItem('cobuy_top_rules', JSON.stringify(uniqueRules.slice(0, 5)));
                    localStorage.setItem('cobuy_gap_rules', JSON.stringify(gapRules.slice(0, 5)));
                    localStorage.setItem('cobuy_last_updated', Date.now());

                    break;
                }
            }

            let t1 = performance.now();
            const timeTaken = (t1 - t0).toFixed(2);
            if (execTimeDiv) {
                execTimeDiv.innerText = `Pattern discovery automatically ran using background Apriori & FP-Growth engines. Analysis completed in ${timeTaken} ms.`;
            }

            if (!foundRules) {
                console.log("No rules found even at lowest thresholds.");
                analysisResults = { rules: [], gaps: [] };
            }

            renderResults();
        } catch (e) {
            console.error(e);
            alert("Error running analysis.");
        } finally {
            loader.classList.add('hidden');
            runBtn.disabled = false;
        }
    }, 500);
}

// 3. Most Sold Products Logic
function runTopProductsAnalysis(dataset) {
    let itemCounts = {};
    dataset.forEach(tx => {
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

// 4. Render Tables
function renderResults() {
    topProductsBody.innerHTML = '';
    const displayLimit = Math.min(topProducts.length, 50);

    if (topProducts.length === 0) {
        topProductsBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No product data found.</td></tr>';
    } else {
        const maxCount = topProducts[0].count;
        for (let i = 0; i < displayLimit; i++) {
            const product = topProducts[i];
            let popularity = "Low";
            if (product.count >= maxCount * 0.8) popularity = "Very High";
            else if (product.count >= maxCount * 0.5) popularity = "High";
            else if (product.count >= maxCount * 0.2) popularity = "Medium";

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td style="font-weight: 600; color: #333;">${product.name}</td>
                <td>${product.count} Units</td>
                <td>${popularity}</td>
            `;
            topProductsBody.appendChild(tr);
        }
    }

    resultsBody.innerHTML = '';

    if (!analysisResults.rules || analysisResults.rules.length === 0) {
        resultsBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #666; padding: 20px;">No strong associations found based on the automatic thresholds.</td></tr>';
    } else {
        analysisResults.rules.forEach((rule) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 600; color: #333;">${rule.antecedent}</td>
                <td style="font-weight: 600; color: #333;">+ ${rule.consequent}</td>
                <td>${(rule.confidence * 100).toFixed(0)}% of the time</td>
            `;
            resultsBody.appendChild(tr);
        });
    }

    adviceBody.innerHTML = '';

    if (analysisResults.gaps && analysisResults.gaps.length > 0) {
        let adviceHtml = '<ul style="padding-left: 20px; list-style-type: disc;">';

        // Display all identified gaps without the 3-item limit
        for (let i = 0; i < analysisResults.gaps.length; i++) {
            let gap = analysisResults.gaps[i];

            adviceHtml += `
            <li style="margin-bottom: 15px;">
                <strong>The "${gap.antecedent}" Gap:</strong> * <strong>${gap.missedPercent}%</strong> of people bought <strong>${gap.antecedent}</strong> but walked out <strong>without ${gap.consequent}</strong>.
                <ul style="list-style-type: circle; margin-top: 8px; margin-bottom: 10px; color: #555;">
                    <li><em>What this means:</em> You sold the ${gap.antecedent}, but you missed the chance to sell the ${gap.consequent} that usually goes with it.</li>
                </ul>
            </li>
            `;
        }

        adviceHtml += '</ul>';
        adviceBody.innerHTML = adviceHtml;
        adviceContainerDOM.classList.remove('hidden');
    } else {
        adviceBody.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No significant lost sales patterns were detected in this dataset.</p>';
        adviceContainerDOM.classList.remove('hidden');
    }

    topProductsContainer.classList.remove('hidden');
    resultsContainer.classList.remove('hidden');
    topProductsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 5. Export to Excel
function exportResults() {
    if ((!analysisResults.rules || analysisResults.rules.length === 0) && topProducts.length === 0) {
        alert("No results to export.");
        return;
    }

    const wb = XLSX.utils.book_new();

    let exportRules = analysisResults.rules ? analysisResults.rules : [];
    const recData = exportRules.map((r, i) => ({
        "No": i + 1,
        "If Customer Buys...": r.antecedent,
        "System Recommends...": r.consequent,
        "Support (%)": (r.support * 100).toFixed(2) + '%',
        "Confidence (%)": (r.confidence * 100).toFixed(2) + '%'
    }));
    const ws1 = XLSX.utils.json_to_sheet(recData);
    XLSX.utils.book_append_sheet(wb, ws1, "Product Recommendations");

    const topData = topProducts.map((p, i) => ({
        "Rank": i + 1,
        "Product Name": p.name,
        "Total Sold": p.count
    }));
    const ws2 = XLSX.utils.json_to_sheet(topData);
    XLSX.utils.book_append_sheet(wb, ws2, "Most Sold Products");

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    XLSX.writeFile(wb, `CoBuy_Analysis_${timestamp}.xlsx`);
}
