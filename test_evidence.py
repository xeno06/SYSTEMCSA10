from mining_logic import MiningEngine

def test_evidence_extraction():
    transactions = [
        ['Milk', 'Bread', 'Butter'],
        ['Milk', 'Bread'],
        ['Eggs', 'Flour'],
        ['Milk', 'Bread', 'Butter', 'Eggs']
    ]
    product_list = ['Milk', 'Bread', 'Butter', 'Eggs', 'Flour']
    
    results = MiningEngine.run_mining(
        transactions=transactions,
        product_list=product_list,
        min_support=0.1,
        min_threshold=0.1,
        algorithm='fp-growth'
    )
    
    rules = results['rules']
    print(f"Total Rules: {len(rules)}")
    
    if len(rules) > 0:
        first_rule = rules[0]
        print(f"Rule: {first_rule['pair']}")
        print(f"Samples count: {len(first_rule['samples'])}")
        if len(first_rule['samples']) > 0:
            print(f"First Sample: {first_rule['samples'][0]['items']}")
            if 'Milk' in first_rule['samples'][0]['items'] and 'Bread' in first_rule['samples'][0]['items']:
                print("VERIFIED: Proof samples match the rule.")
            else:
                print("FAILED: Proof samples do not match the rule.")
    else:
        print("FAILED: No rules found to test.")

if __name__ == "__main__":
    test_evidence_extraction()
