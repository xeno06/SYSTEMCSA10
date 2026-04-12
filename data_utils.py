import pandas as pd
import numpy as np
from io import BytesIO

class DataUtils:
    @staticmethod
    def preprocess_transactions(file_content, extension):
        """
        Automated preprocessing and validation of transaction records.
        Handles both CSV and Excel formats.
        """
        try:
            if extension == 'csv':
                df = pd.read_csv(BytesIO(file_content))
            else:
                df = pd.read_excel(BytesIO(file_content))
            
            # Identify columns
            cols = df.columns.tolist()
            tx_col = next((c for c in cols if any(k in c.lower() for k in ['transaction', 'invoice', 'order', 'id'])), None)
            prod_col = next((c for c in cols if any(k in c.lower() for k in ['product', 'item', 'description', 'name'])), None)
            
            if not tx_col or not prod_col:
                # Fallback: Assume first column is TX ID, second is Product
                tx_col, prod_col = cols[0], cols[1]
            
            # Validation: Drop missing values
            df = df.dropna(subset=[tx_col, prod_col])
            
            # Transformation: Group by Transaction ID
            transactions = df.groupby(tx_col)[prod_col].apply(lambda x: [str(i).strip() for i in x]).tolist()
            
            # Product Count Validation
            unique_products = sorted(list(set(df[prod_col].astype(str).str.strip())))
            
            return {
                "transactions": transactions,
                "product_list": unique_products,
                "stats": {
                    "total_rows": len(df),
                    "unique_tx": len(transactions),
                    "unique_products": len(unique_products)
                }
            }
        except Exception as e:
            raise ValueError(f"Preprocessing Error: {str(e)}")

    @staticmethod
    def one_hot_encode(transactions, product_list):
        """
        Convert transactions into a one-hot encoded DataFrame for MLxtend.
        """
        encoded_data = []
        for tx in transactions:
            row = {prod: (prod in tx) for prod in product_list}
            encoded_data.append(row)
        
        return pd.DataFrame(encoded_data)
