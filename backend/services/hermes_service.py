class HermesService:
    def analyze_meeting(self, transcript: str):
        # Mock analysis
        return {
            "summary": "Mock meeting summary",
            "decisions": [{"description": "Use OAuth2", "owner": "Alice"}],
            "actions": [{"task": "Setup Auth", "owner": "Bob", "due_date": "2026-06-30"}],
            "risks": [{"description": "Tight deadline", "severity": "High"}]
        }
