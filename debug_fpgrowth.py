import pandas as pd
from mining_logic import MiningEngine
import time
import random

def test_fp_growth_large():
    # 1. Mock a larger dataset (e.g. 500 orders, many items)
    products = [f"Item_{i}" for i in range(100)]
    transactions = []
    for _ in range(500):
        # Each transaction has 2-8 random items
        sample_size = random.randint(2, 8)
        transactions.append(random.sample(products, sample_size))
        
    # Inject some frequent patterns to ensure results
    for _ in range(50):
        transactions.append(['Milk', 'Bread', 'Butter'])
        
    product_list = sorted(list(set([it for tx in transactions for it in tx])))
    
    print(f"Testing FP-Growth with {len(transactions)} transactions and {len(product_list)} products...")
    
    try:
        t0 = time.time()
        results = MiningEngine.run_mining(
            transactions=transactions,
            product_list=product_list,
            min_support=0.01,
            min_threshold=0.1,
            algorithm='fp-growth'
        )
        t1 = time.time()
        
        print(f"Success! Time taken: {(t1-t0)*1000:.2f}ms")
        print(f"Algorithm Used: {results['meta']['algorithm']}")
        print(f"Rules found: {len(results['rules'])}")
        print(f"Itemsets found: {results['meta']['itemset_count']}")
        
        if len(results['rules']) == 0:
            print("WARNING: No rules found!")
        else:
            print(f"Top Rule: {results['rules'][0]['pair']} (Conf: {results['rules'][0]['conf']}%)")
            
    except Exception as e:
        print(f"ERROR during mining: {str(e)}")

if __name__ == "__main__":
    test_fp_growth_large()
