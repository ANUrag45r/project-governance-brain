import pytest
from fastapi.testclient import TestClient
import sys
import os

# Adjust import path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database import SessionLocal
from services.hermes_service import HermesService
from services.gbrain_service import GBrainService
from services.gstack_service import GStackService
from config import settings

# Disable active Gemini API requests during tests to maintain offline determinism
settings.GEMINI_API_KEY = ""

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome" in response.json()["message"]

def test_hermes_meeting_analyzer():
    hermes = HermesService()
    transcript = (
        "Alice: We decided to use OAuth2.\n"
        "Bob: I will setup the auth scaffolding.\n"
        "Charlie: Blocker is database migration timeline delay, which is a High risk.\n"
    )
    result = hermes.analyze_meeting("Test Meeting", transcript)
    
    assert "OAuth2" in result["summary"]
    assert len(result["decisions"]) == 1
    assert "OAuth2" in result["decisions"][0]["description"]
    assert len(result["actions"]) == 1
    assert "auth scaffolding" in result["actions"][0]["task"]
    assert len(result["risks"]) == 1
    assert "migration timeline delay" in result["risks"][0]["description"]
    assert result["risks"][0]["severity"] == "High"

def test_gbrain_knowledge_graph():
    db = SessionLocal()
    try:
        gbrain = GBrainService()
        
        # Test storing relation and querying
        # Note: In SQLite tests we can execute query and verify response structure
        res = gbrain.query_graph(db, "OAuth2")
        assert "meetings" in res
        assert "decisions" in res
        assert "actions" in res
        assert "risks" in res
    finally:
        db.close()

def test_gstack_health_analyzer():
    db = SessionLocal()
    try:
        gstack = GStackService()
        res = gstack.execute_workflow(db, "Sprint Health Analyzer Skill")
        assert "health_score" in res
        assert 0 <= res["health_score"] <= 100
    finally:
        db.close()

def test_api_endpoints():
    # Test dashboard endpoint
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "total_meetings" in data
    assert "health_score" in data
    
    # Test skills endpoint
    res = client.get("/api/skills")
    assert res.status_code == 200
    assert len(res.json()) > 0
    
    # Test profile endpoint
    res = client.get("/api/auth/profile")
    assert res.status_code == 200
    assert "tenant_id" in res.json()
