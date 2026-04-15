import pandas as pd
import random

def generate_mock_data(filename, row_count, pattern_strength=0.3):
    """
    Generates a mock transaction CSV with clear patterns.
    """
    products = ['Milk', 'Bread', 'Butter', 'Eggs', 'Cheese', 'Coffee', 'Sugar', 'Tea', 'Cookies', 'Soda']
    data = []
    
    # Generate random transactions
    for i in range(row_count):
        tx_id = f"TX_{1000 + (i // 3)}" # Roughly 3 items per transaction
        
        # Inject controlled patterns based on pattern_strength
        if random.random() < pattern_strength:
            # Pattern A: Coffee + Sugar
            item = random.choice(['Coffee', 'Sugar'])
        elif random.random() < pattern_strength:
            # Pattern B: Milk + Bread
            item = random.choice(['Milk', 'Bread'])
        else:
            item = random.choice(products)
            
        data.append({'Transaction ID': tx_id, 'Product Name': item})
    
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"Generated {filename} with {len(df)} rows.")

if __name__ == "__main__":
    # 1. Apriori Scale (~150 rows -> trigger Apriori < 300)
    generate_mock_data('C:/Users/kkrys/Desktop/xeno/SYSTEMCSA10/mock_apriori.csv', 150)
    
    # 2. FP-Growth Scale (~550 rows -> trigger FP-Growth > 400)
    generate_mock_data('C:/Users/kkrys/Desktop/xeno/SYSTEMCSA10/mock_fpgrowth.csv', 550)
