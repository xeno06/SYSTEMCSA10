import pandas as pd
from mlxtend.frequent_patterns import apriori, fpgrowth, association_rules
from data_utils import DataUtils
import time

class MiningEngine:
    # --- BI KNOWLEDGE BASE (RESEARCH ALIGNED) ---
    SEASONAL_TARGETS = {
        "convenience store": {
            12: ["ham", "queso de bola", "hotdog", "spaghetti", "pasta", "fruit salad", "cream"],
            1: ["vitamins", "planner", "healthy"],
            6: ["umbrella", "raincoat", "noodle"],
            10: ["candy", "candle"]
        },
        "coffee shop": {
            "summer": ["iced", "cold brew", "frappe", "smoothie"],
            "winter": ["hot", "latte", "cappuccino", "soup", "pastry"],
            12: ["peppermint", "gingerbread", "holiday"]
        },
        "pet food shop": {
            "summer": ["cooling mat", "flea treatment", "shampoo"],
            "winter": ["jacket", "bed", "heating", "vitamin"],
            12: ["treat", "gift", "toy"]
        }
    }

    @staticmethod
    def get_seasonal_alert(business_type, month, top_products):
        """Detects if seasonal items are trending."""
        bt = business_type.lower()
        if bt not in MiningEngine.SEASONAL_TARGETS:
            return None
            
        targets = MiningEngine.SEASONAL_TARGETS[bt].get(month, [])
        if not targets:
            # Fallback to seasonal themes
            if month in [3, 4, 5]: # Summer (PH context)
                targets = MiningEngine.SEASONAL_TARGETS[bt].get("summer", [])
            elif month in [11, 12, 1]: # Cold/Winter/Holiday
                targets = MiningEngine.SEASONAL_TARGETS[bt].get("winter", [])

        # Find items and their specific counts for "proof"
        found_data = []
        for p in top_products:
            for t in targets:
                if t in p['name'].lower():
                    found_data.append(p)
                    break
        
        if found_data:
            found_names = [p['name'] for p in found_data]
            total_seasonal_sales = sum(p['count'] for p in found_data)
            return {
                "theme": "Seasonal Trend Detected",
                "items": found_names,
                "evidence_count": total_seasonal_sales,
                "suggestion": f"Increase stock of {', '.join(found_names[:3])} ({total_seasonal_sales} sales) to meet seasonal demand."
            }
        return None

    @staticmethod
    def run_mining(transactions, product_list, min_support=0.01, min_threshold=0.1, algorithm='fp-growth', business_type="convenience store", active_month=None):
        """
        Executes ARM using MLxtend.
        """
        t0 = time.time()
        
        # 1. Convert to transactions to a OHE DataFrame
        from mlxtend.preprocessing import TransactionEncoder
        te = TransactionEncoder()
        te_ary = te.fit(transactions).transform(transactions)
        df_encoded = pd.DataFrame(te_ary, columns=te.columns_)
        
        # 2. Run selected algorithm
        if algorithm == 'apriori':
            frequent_itemsets = apriori(df_encoded, min_support=min_support, use_colnames=True)
        else:
            frequent_itemsets = fpgrowth(df_encoded, min_support=min_support, use_colnames=True)
        
        # 3. Initialize results
        formatted_rules = []
        breakdown = {}
        itemset_details = {}
        itemset_count = len(frequent_itemsets)
        rule_count = 0
        
        # 4. Process Itemsets & Rules
        if not frequent_itemsets.empty:
            for idx, row in frequent_itemsets.iterrows():
                items = list(row['itemsets'])
                size = len(items)
                breakdown[size] = breakdown.get(size, 0) + 1
                
                if size not in itemset_details:
                    itemset_details[size] = []
                itemset_details[size].append({
                    "items": items,
                    "support": round(row['support'], 4)
                })
            
            rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_threshold, num_itemsets=len(transactions))
            rule_count = len(rules)
            
            for idx, row in rules.sort_values(by='lift', ascending=False).iterrows():
                rule_items = set(row['antecedents']).union(set(row['consequents']))
                
                # Find ALL transactions containing this rule's items
                matching_transactions = [tx for tx in transactions if rule_items.issubset(set(tx))]
                const_count = len(matching_transactions)
                
                # Take first 100 as samples for the UI
                samples = [{"items": tx} for tx in matching_transactions[:100]]
                
                # --- BI ACTION GENERATOR LOGIC (INSIGHT -> ACTION) ---
                strategy = "Standard Observation"
                action = "Monitor these items for future trends."
                lift = row['lift']
                conf = row['confidence']
                supp = row['support']
                
                # Higher confidence & lift = Promo Bundle
                if lift > 1.8 and conf > 0.7:
                    strategy = "High-Value Bundle"
                    action = f"Create a 'Power Pair' discount bundle for these items."
                # Moderate relationship = Strategic Placement
                elif lift > 1.3:
                    strategy = "Smart Shelf Placement"
                    action = f"Place {list(row['antecedents'])[0]} near {list(row['consequents'])[0]} to boost impulse buys."
                # High frequency = Inventory management
                elif supp > 0.08:
                    strategy = "Inventory Priority"
                    action = f"Always restock {list(row['antecedents'])[0]} before {list(row['consequents'])[0]} runs out."
                # Consistent pairing = Cross-Sell
                elif conf > 0.5:
                    strategy = "Cross-Sell Campaign"
                    action = f"Train staff to suggest {list(row['consequents'])[0]} when customers buy {list(row['antecedents'])[0]}."
                elif lift > 1.1:
                    strategy = "Trial Promotion"
                    action = f"Give a small discount on {list(row['consequents'])[0]} with every purchase of {list(row['antecedents'])[0]}."

                formatted_rules.append({
                    "antecedent": ", ".join(list(row['antecedents'])),
                    "consequent": ", ".join(list(row['consequents'])),
                    "support": round(supp, 4),
                    "conf": round(conf * 100, 1),
                    "lift": round(lift, 4),
                    "count": const_count,
                    "pair": f"{', '.join(list(row['antecedents']))} + {', '.join(list(row['consequents']))}",
                    "samples": samples,
                    "strategy": strategy,
                    "action": action
                })
            
        # 5. Calculate Top Individual Products
        all_items = [item for tx in transactions for item in tx]
        counts = pd.Series(all_items).value_counts()
        top_products = [{"name": str(name), "count": int(count)} for name, count in counts.items()]

        # 6. Seasonal Insights
        month_to_use = active_month if active_month else time.localtime().tm_mon
        seasonal_alert = MiningEngine.get_seasonal_alert(business_type, month_to_use, top_products[:15])

        return {
            "rules": formatted_rules,
            "topPairs": formatted_rules,
            "topProducts": top_products,
            "breakdown": breakdown,
            "itemset_details": itemset_details,
            "totalTransactions": len(transactions),
            "uniqueProducts": len(product_list),
            "totalItems": len(all_items),
            "seasonal_insight": seasonal_alert,
            "meta": {
                "algorithm": "Apriori" if algorithm == 'apriori' else "FP-Growth",
                "time_taken": round((time.time() - t0) * 1000, 2),
                "itemset_count": itemset_count,
                "rule_count": rule_count,
                "business_type": business_type,
                "analysis_month": month_to_use
            }
        }

