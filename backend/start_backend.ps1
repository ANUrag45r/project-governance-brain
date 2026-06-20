$ErrorActionPreference = "Stop"

Write-Host "Creating Python virtual environment..."
python -m venv venv

Write-Host "Activating virtual environment..."
.\venv\Scripts\Activate.ps1

Write-Host "Installing dependencies..."
pip install -r requirements.txt

Write-Host "Seeding the database..."
python seed.py

Write-Host "Starting FastAPI backend..."
uvicorn app:app --reload --host 0.0.0.0 --port 8000
