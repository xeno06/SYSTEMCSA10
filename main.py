from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from data_utils import DataUtils
from mining_logic import MiningEngine
import json

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
    algorithm: str = Form("fp-growth")
):
    """
    Endpoint for uploading a transaction file and running ARM.
    """
    try:
        content = await file.read()
        ext = file.filename.split('.')[-1].lower()
        if ext not in ['csv', 'xlsx', 'xls']:
            raise HTTPException(status_code=400, detail="Unsupported file format.")
        
        # 1. Preprocessing (DataUtils)
        data = DataUtils.preprocess_transactions(content, ext)
        
        # 2. Mining Loop (MiningEngine)
        results = MiningEngine.run_mining(
            transactions=data['transactions'],
            product_list=data['product_list'],
            min_support=min_support,
            min_threshold=min_confidence,
            algorithm=algorithm
        )
        
        # 3. Add original stats to results
        results['stats'] = data['stats']
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "Active", "engine": "Python/FastAPI (Research-Aligned)"}

if __name__ == "__main__":
    import uvicorn
    # Enable reload for industrial-grade development experience
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

