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
        
        # 1. Convert to transactions to a OHE DataFrame using optimized TransactionEncoder
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
        itemset_details = {}  # Store actual itemsets by size
        itemset_count = len(frequent_itemsets)
        rule_count = 0
        
        # 4. Process Itemsets & Rules (if found)
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
            
            rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_threshold)
            rule_count = len(rules)
            
            for idx, row in rules.sort_values(by='confidence', ascending=False).iterrows():
                # Find proof samples (literal transactions containing the rule)
                rule_items = set(row['antecedents']).union(set(row['consequents']))
                samples = []
                for tx in transactions:
                    if rule_items.issubset(set(tx)):
                        samples.append({"items": tx})
                        if len(samples) >= 3:
                            break
                            
                formatted_rules.append({
                    "antecedent": ", ".join(list(row['antecedents'])),
                    "consequent": ", ".join(list(row['consequents'])),
                    "support": round(row['support'], 4),
                    "conf": round(row['confidence'] * 100, 1), # UI expects percentage
                    "lift": round(row['lift'], 4),
                    "count": int(row['support'] * len(transactions)), # Number of times this pair occurred
                    "pair": f"{', '.join(list(row['antecedents']))} + {', '.join(list(row['consequents']))}",
                    "samples": samples
                })
            
        # 5. Calculate Top Individual Products (Frequencies) ALWAYS
        all_items = [item for tx in transactions for item in tx]
        counts = pd.Series(all_items).value_counts()
        top_products = [{"name": str(name), "count": int(count)} for name, count in counts.items()]

        return {
            "rules": formatted_rules,
            "topPairs": formatted_rules, # Compatibility alias
            "topProducts": top_products,
            "breakdown": breakdown,
            "itemset_details": itemset_details,
            "totalTransactions": len(transactions),
            "uniqueProducts": len(product_list),
            "totalItems": len(all_items),
            "meta": {
                "algorithm": "Apriori" if algorithm == 'apriori' else "FP-Growth",
                "time_taken": round((time.time() - t0) * 1000, 2),
                "itemset_count": itemset_count,
                "rule_count": rule_count
            }
        }

