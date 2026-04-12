document.addEventListener('DOMContentLoaded', () => {
    initNetworkGraph();
});

// Update if another tab runs the algorithm
window.addEventListener('storage', function (e) {
    if (e.key === 'cobuy_last_updated') {
        initNetworkGraph();
    }
});

function initNetworkGraph() {
    // 1. Load rules from LocalStorage
    let topRulesStr = localStorage.getItem('cobuy_top_rules');
    let gapRulesStr = localStorage.getItem('cobuy_gap_rules');

    let allRules = [];
    if (topRulesStr) {
        try { allRules = allRules.concat(JSON.parse(topRulesStr)); } catch (e) { }
    }
    if (gapRulesStr) {
        try { allRules = allRules.concat(JSON.parse(gapRulesStr)); } catch (e) { }
    }

    if (allRules.length === 0) {
        // Fallback dummy data if no local storage found
        allRules = [
            { antecedent: "Bread", consequent: "Milk", confidence: 0.85, lift: 2.1 },
            { antecedent: "Coffee", consequent: "Sugar", confidence: 0.75, lift: 1.8 },
            { antecedent: "Eggs", consequent: "Bacon", confidence: 0.65, lift: 1.5 },
            { antecedent: "Bread", consequent: "Butter", confidence: 0.90, lift: 2.5 },
            { antecedent: "Milk", consequent: "Cereal", confidence: 0.60, lift: 1.2 },
            { antecedent: "Coffee", consequent: "Mug", confidence: 0.40, lift: 1.1 }
        ];
    }

    // 2. Parse into Vis.js Format (Nodes and Edges)
    let nodesRaw = new Map(); // to keep them unique
    let edgesRaw = [];

    // Helper to add nodes
    let nodeIdCounter = 1;
    function addNode(name) {
        if (!nodesRaw.has(name)) {
            nodesRaw.set(name, {
                id: nodeIdCounter++,
                label: name,
                title: 'Product: ' + name, // Tooltip
                value: 1 // Base size
            });
        }
        return nodesRaw.get(name).id;
    }

    allRules.forEach(rule => {
        // Safety check: ensure the rule actually has an antecedent and consequent
        if (!rule || !rule.antecedent || !rule.consequent) return;

        // Market Basket Analysis sometimes returns multiple items as a single antecedent/consequent (e.g. "Bread, Butter")
        // For a network graph, we need to split these into individual nodes and connect them.
        let antecedents = String(rule.antecedent).split(',').map(s => s.trim()).filter(s => s !== '');
        let consequents = String(rule.consequent).split(',').map(s => s.trim()).filter(s => s !== '');

        if (antecedents.length === 0 || consequents.length === 0) return;

        let antIds = antecedents.map(name => addNode(name));
        let conIds = consequents.map(name => addNode(name));

        // Increase node sizes based on involvement
        antecedents.forEach(name => nodesRaw.get(name).value += 1);
        consequents.forEach(name => nodesRaw.get(name).value += 1);

        // Create edges linking all antecedents to all consequents for this rule
        antIds.forEach(aId => {
            conIds.forEach(cId => {
                // Prevent self-linking just in case
                if (aId !== cId) {
                    edgesRaw.push({
                        from: aId,
                        to: cId,
                        value: rule.confidence || 0.5, // Edge thickness
                        title: `Confidence: ${Math.round((rule.confidence || 0.5) * 100)}%`, // Tooltip
                        color: { color: 'rgba(0, 242, 254, 0.4)', highlight: '#00f2fe' }
                    });
                }
            });
        });
    });

    const nodes = new vis.DataSet(Array.from(nodesRaw.values()));
    const edges = new vis.DataSet(edgesRaw);

    // 3. Draw the Network
    const container = document.getElementById('analyticsNetwork');
    const data = { nodes: nodes, edges: edges };

    const options = {
        nodes: {
            shape: 'dot',
            color: {
                background: '#12192b',
                border: '#00f2fe',
                highlight: { background: '#00f2fe', border: '#fff' },
                hover: { background: '#00f2fe', border: '#fff' }
            },
            font: { color: '#ffffff', size: 14, face: 'Inter' },
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(0, 242, 254, 0.5)', size: 10 }
        },
        edges: {
            smooth: { type: 'continuous' },
            arrows: { to: { enabled: true, scaleFactor: 0.5 } }
        },
        physics: {
            barnesHut: {
                gravitationalConstant: -2000,
                centralGravity: 0.3,
                springLength: 150,
                springConstant: 0.04
            },
            stabilization: { iterations: 150 }
        },
        interaction: { hover: true, tooltipDelay: 200 }
    };

    const network = new vis.Network(container, data, options);

    // 4. Handle Click Event for Side Panel
    network.on("click", function (params) {
        const detailsPanel = document.getElementById('nodeDetailsContent');

        if (params.nodes.length > 0) {
            let selectedNodeId = params.nodes[0];
            let nodeData = nodes.get(selectedNodeId);

            // Find all edges connected to this node
            let connectedEdges = edges.get({
                filter: function (item) {
                    return item.from === selectedNodeId || item.to === selectedNodeId;
                }
            });

            // Build HTML
            let html = `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #fff; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;">
                        <span class="dot" style="background: var(--neon-cyan); width: 12px; height: 12px; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px var(--neon-cyan);"></span>
                        ${nodeData.label}
                    </h3>
                    <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem; margin-top: 5px;">
                        Ecosystem Hub
                    </p>
                </div>
                
                <h4 style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Strongest Connections</h4>
            `;

            if (connectedEdges.length === 0) {
                html += `<p style="color: rgba(255,255,255,0.5);">No direct rules attached.</p>`;
            } else {
                connectedEdges.forEach(edge => {
                    let targetNodeId = (edge.from === selectedNodeId) ? edge.to : edge.from;
                    let targetNode = nodes.get(targetNodeId);
                    let confidence = Math.round((edge.value || 0) * 100);

                    html += `
                        <div class="node-info-card">
                            <h5>+ ${targetNode.label}</h5>
                            <div class="connection-item">
                                <span>Co-Purchase Probability</span>
                                <span style="font-weight: 600; color: #fff;">${confidence}%</span>
                            </div>
                        </div>
                    `;
                });
            }

            detailsPanel.innerHTML = html;
        } else {
            // Clicked empty space
            detailsPanel.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-mouse-pointer" style="font-size: 2rem; color: rgba(255,255,255,0.2); margin-bottom: 15px;"></i>
                    <p style="color: rgba(255,255,255,0.6); text-align: center;">Click any glowing node on the graph to see its direct ecosystem connections.</p>
                </div>
            `;
        }
    });
}
