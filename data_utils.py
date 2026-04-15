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
            
            # Smart detection for Transaction Column
            tx_col = next((c for c in cols if any(k in c.lower() for k in ['transaction', 'invoice', 'order', 'id', 'member', 'number'])), None)
            
            # Smart detection for Product Column
            prod_col = next((c for c in cols if any(k in c.lower() for k in ['product', 'item', 'description', 'name', 'model', 'article'])), None)
            
            # If still missing, use heuristic fallbacks but preserve found ones
            if not tx_col and not prod_col:
                tx_col, prod_col = cols[0], cols[1]
            elif not tx_col:
                tx_col = next(c for c in cols if c != prod_col)
            elif not prod_col:
                prod_col = next(c for c in cols if c != tx_col)
            
            # Validation: Drop missing values
            df = df.dropna(subset=[tx_col, prod_col])
            
            # Transformation: Group by Transaction ID
            transactions = df.groupby(tx_col)[prod_col].apply(lambda x: [str(i).strip() for i in x]).tolist()
            
            # Product Count Validation
            unique_products = sorted(list(set(df[prod_col].astype(str).str.strip())))
            
            return {
                "transactions": transactions,
                "product_list": unique_products,
                "mapping": {"tx": tx_col, "prod": prod_col},
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
        from mlxtend.preprocessing import TransactionEncoder
        te = TransactionEncoder()
        te_ary = te.fit(transactions).transform(transactions)
        return pd.DataFrame(te_ary, columns=te.columns_)
