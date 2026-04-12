# CoBuy System Startup Script
# This script starts the Python ARM Engine and the React Frontend simultaneously.

Write-Host "--- Starting CoBuy Market Intelligence Suite ---" -ForegroundColor Cyan

# 1. Start Python Backend
Write-Host "[1/2] Starting Python ARM Engine (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python main.py" -WindowStyle Normal

# 2. Start React Frontend
Write-Host "[2/2] Starting React Frontend (Vite)..." -ForegroundColor Yellow
Set-Location react-app
npm run dev

Write-Host "--- System Ready ---" -ForegroundColor Green
