import pandas as pd
from mining_logic import MiningEngine
import time

def test_no_results_stability():
    # 1. Mock a sparse dataset (everyone buys a different item)
    # 100 transactions, 100 unique items -> 1% support threshold (1 appearance) 
    # But if support is 10%, no rules will be found.
    transactions = [[f"Item_{i}"] for i in range(100)]
    product_list = [f"Item_{i}" for i in range(100)]
    
    print(f"Testing Stability with {len(transactions)} unique transactions...")
    
    try:
        t0 = time.time()
        # min_support = 0.5 (50%) -> definitely no results
        results = MiningEngine.run_mining(
            transactions=transactions,
            product_list=product_list,
            min_support=0.5,
            min_threshold=0.1,
            algorithm='fp-growth'
        )
        t1 = time.time()
        
        print(f"Success! Time taken: {(t1-t0)*1000:.2f}ms")
        print(f"Algorithm Used: {results['meta']['algorithm']}")
        print(f"Rules found: {len(results['rules'])}")
        print(f"Top Products count: {len(results['topProducts'])}")
        print(f"Itemset Count Stats: {results['meta']['itemset_count']}")
        
        # KEY CHECK: topProducts should NOT be empty even if rules are empty
        if len(results['topProducts']) == 100:
            print("VERIFIED: topProducts correctly populated despite zero rules.")
        else:
            print(f"FAILED: topProducts count is {len(results['topProducts'])}")
            
    except Exception as e:
        print(f"ERROR during mining: {str(e)}")

if __name__ == "__main__":
    test_no_results_stability()
