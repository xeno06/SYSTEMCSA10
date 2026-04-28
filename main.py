from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from data_utils import DataUtils
from mining_logic import MiningEngine
import json
import traceback

app = FastAPI(title="CoBuy ARM Engine")

# Enable CORS for React integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/mine")
async def mine_associations(
    file: UploadFile = File(...),
    min_support: float = Form(0.01),
    min_confidence: float = Form(0.1),
    algorithm: str = Form("fp-growth"),
    business_type: str = Form("convenience store")
):
    """
    Endpoint for uploading a transaction file and running ARM.
    """
    print(f"DEBUG: /mine request received. File: {file.filename}, Alg: {algorithm}, Supp: {min_support}, Conf: {min_confidence}")
    try:
        content = await file.read()
        ext = file.filename.split('.')[-1].lower()
        if ext not in ['csv', 'xlsx', 'xls']:
            raise HTTPException(status_code=400, detail="Unsupported file format.")
        
        # 1. Preprocessing (DataUtils)
        data = DataUtils.preprocess_transactions(content, ext)
        
        # Check for critical errors that should block analysis
        critical_errors = [a for a in data.get('validation_alerts', []) if "CRITICAL" in a]
        if critical_errors:
            raise HTTPException(status_code=422, detail=critical_errors[0])
        
        # 2. Mining Loop (MiningEngine)
        results = MiningEngine.run_mining(
            transactions=data['transactions'],
            product_list=data['product_list'],
            min_support=min_support,
            min_threshold=min_confidence,
            algorithm=algorithm,
            business_type=business_type,
            active_month=data.get('active_month')
        )
        
        # 3. Add original stats and mapping to results
        results['stats'] = data['stats']
        results['mapping'] = data['mapping']
        results['validation_alerts'] = data.get('validation_alerts', [])
        
        return results
    except HTTPException as he:
        raise he
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "Active", "engine": "Python/FastAPI (Research-Aligned)"}

if __name__ == "__main__":
    import uvicorn
    # Enable reload for industrial-grade development experience
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

