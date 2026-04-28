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

            # Smart detection for Date Column
            date_col = next((c for c in cols if any(k in c.lower() for k in ['date', 'time', 'timestamp', 'period'])), None)
            
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
            
            # --- DATA VALIDATION (PANEL SUGGESTION) ---
            validation_alerts = []
            initial_row_count = len(df)
            
            # Check for high percentage of missing values
            null_count = df[[tx_col, prod_col]].isnull().any(axis=1).sum()
            if null_count > (initial_row_count * 0.1):
                validation_alerts.append(f"High data sparsity: {null_count} rows contain null values.")

            # Drop missing values
            df = df.dropna(subset=[tx_col, prod_col])
            
            # 1. Row-level Duplicate Detection
            duplicates = df.duplicated().sum()
            if duplicates > 0:
                validation_alerts.append(f"Cleaned {duplicates} identical rows to ensure data integrity.")
                df = df.drop_duplicates()

            # 2. Assign Unique ID if missing or inconsistent
            if df[tx_col].isnull().all():
                df[tx_col] = range(len(df))
                validation_alerts.append("No Transaction IDs found. Assigned unique IDs to each record.")

            # --- TRANSFORMATION ---
            # Group by Transaction ID
            grouped = df.groupby(tx_col)[prod_col].apply(lambda x: sorted([str(i).strip() for i in x])).reset_index()
            
            # 3. Transaction-level Duplicate Detection (Same items in different transactions)
            # We convert the list of items to a tuple so it's hashable for duplicate detection
            grouped['items_tuple'] = grouped[prod_col].apply(tuple)
            tx_duplicates = grouped.duplicated(subset=['items_tuple']).sum()
            
            if tx_duplicates > (len(grouped) * 0.5): # If > 50% are exact duplicates, something is wrong
                validation_alerts.append(f"Note: {tx_duplicates} transactions are exact duplicates. Analysis proceeded but results may be skewed.")
                # We won't actually "halt" in Python but we mark it for the UI to handle if it chooses
            elif tx_duplicates > 0:
                validation_alerts.append(f"Note: {tx_duplicates} transactions have identical item sets.")

            transactions = grouped[prod_col].tolist()
            
            # Extract month if date column exists
            active_month = None
            if date_col:
                try:
                    df[date_col] = pd.to_datetime(df[date_col])
                    active_month = int(df[date_col].dt.month.mode()[0]) # Most frequent month in dataset
                except: pass
            
            # Product Count Validation
            unique_products = sorted(list(set(df[prod_col].astype(str).str.strip())))
            
            return {
                "transactions": transactions,
                "product_list": unique_products,
                "mapping": {"tx": tx_col, "prod": prod_col, "date": date_col},
                "active_month": active_month,
                "validation_alerts": validation_alerts,
                "stats": {
                    "total_rows": len(df),
                    "unique_tx": len(transactions),
                    "unique_products": len(unique_products),
                    "duplicates_removed": int(duplicates)
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
