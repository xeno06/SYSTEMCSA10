import pandas as pd
from mlxtend.frequent_patterns import apriori, fpgrowth, association_rules
from data_utils import DataUtils
import time

class MiningEngine:
    @staticmethod
    def run_mining(transactions, product_list, min_support=0.01, min_threshold=0.1, algorithm='fp-growth'):
        """
        Executes ARM using MLxtend.
        """
        t0 = time.time()
        
        # 1. Convert to transactions to a OHE DataFrame
        df_encoded = pd.DataFrame([[ (item in tx) for item in product_list ] for tx in transactions ], columns=product_list)
        
        # 2. Run selected algorithm
        if algorithm == 'apriori':
            frequent_itemsets = apriori(df_encoded, min_support=min_support, use_colnames=True)
        else:
            frequent_itemsets = fpgrowth(df_encoded, min_support=min_support, use_colnames=True)
        
        if frequent_itemsets.empty:
            return {
                "rules": [],
                "itemsets": {},
                "meta": {
                    "algorithm": algorithm,
                    "time_taken": (time.time() - t0) * 1000
                }
            }
        
        # 3. Generate Association Rules
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_threshold)
        
        # 4. Format Output for Frontend
        formatted_rules = []
        for idx, row in rules.sort_values(by='confidence', ascending=False).iterrows():
            formatted_rules.append({
                "antecedent": ", ".join(list(row['antecedents'])),
                "consequent": ", ".join(list(row['consequents'])),
                "support": round(row['support'], 4),
                "conf": round(row['confidence'] * 100, 1), # UI expects percentage
                "lift": round(row['lift'], 4),
                "count": int(row['support'] * len(transactions)), # Number of times this pair occurred
                "pair": f"{', '.join(list(row['antecedents']))} + {', '.join(list(row['consequents']))}"
            })
            
        # 5. Calculate Top Individual Products (Frequencies)
        product_counts = {}
        for tx in transactions:
            for item in tx:
                product_counts[item] = product_counts.get(item, 0) + 1
        
        top_products = [{"name": k, "count": v} for k, v in sorted(product_counts.items(), key=lambda x: x[1], reverse=True)]

        # 6. Breakdown by Itemset Size
        breakdown = {}
        for idx, row in frequent_itemsets.iterrows():
            size = len(row['itemsets'])
            breakdown[size] = breakdown.get(size, 0) + 1
            
        return {
            "rules": formatted_rules,
            "topPairs": formatted_rules, # Compatibility alias
            "topProducts": top_products,
            "breakdown": breakdown,
            "totalTransactions": len(transactions),
            "uniqueProducts": len(product_list),
            "totalItems": sum(product_counts.values()),
            "meta": {
                "algorithm": "Apriori" if algorithm == 'apriori' else "FP-Growth",
                "time_taken": round((time.time() - t0) * 1000, 2),
                "itemset_count": len(frequent_itemsets),
                "rule_count": len(rules)
            }
        }

