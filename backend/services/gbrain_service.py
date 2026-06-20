from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.graph_edge import GraphEdge
from models.meeting import Meeting
from models.decision import Decision
from models.action import Action
from models.risk import Risk
from config import settings
import logging
import httpx
import json

logger = logging.getLogger("gbrain")

class GBrainService:
    def store_relation(
        self, 
        db: Session, 
        source_type: str, 
        source_id: int, 
        target_type: str, 
        target_id: int, 
        relationship_type: str
    ):
        """Stores a relationship edge in the GBrain Knowledge Graph."""
        try:
            # Check if edge already exists
            existing = db.query(GraphEdge).filter(
                GraphEdge.source_type == source_type,
                GraphEdge.source_id == source_id,
                GraphEdge.target_type == target_type,
                GraphEdge.target_id == target_id,
                GraphEdge.relationship_type == relationship_type
            ).first()
            
            if not existing:
                edge = GraphEdge(
                    source_type=source_type,
                    source_id=source_id,
                    target_type=target_type,
                    target_id=target_id,
                    relationship_type=relationship_type
                )
                db.add(edge)
                db.commit()
                logger.info(f"Stored Graph Edge: ({source_type}:{source_id}) -[{relationship_type}]-> ({target_type}:{target_id})")
        except Exception as e:
            db.rollback()
            logger.error(f"Error storing graph relation: {e}")

    def query_graph(self, db: Session, query: str) -> dict:
        """
        Traverses the Knowledge Graph by finding entities matching the search query,
        retrieving their connected entities through GraphEdge relationships,
        and aggregating the results. Uses Gemini for query expansion if available.
        """
        expanded_keywords = []
        status_filter = None

        # 1. Use Gemini for Query Expansion / Semantic Intent
        if settings.GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                prompt = f"""
Analyze the following natural language search query for a project governance database:
"{query}"

You must output a single JSON object containing:
1. "keywords": A list of search terms, names, technologies, or subjects mentioned (e.g. ["OAuth", "authentication", "Bob"]). Expand synonyms or abbreviations (e.g., if query is "charlie's task", include "charlie").
2. "status_filter": If the user is specifically looking for items with a particular status, return one of "Open", "In Progress", "Done", "Overdue". Otherwise, return null.

Ensure your response is valid JSON and strictly adheres to the schema below:
{{
  "keywords": ["word1", "word2"],
  "status_filter": "Open|In Progress|Done|Overdue|null"
}}
"""
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                }
                
                response = httpx.post(url, json=payload, timeout=10.0)
                if response.status_code == 200:
                    res_data = response.json()
                    text_response = res_data['candidates'][0]['content']['parts'][0]['text']
                    result = json.loads(text_response)
                    expanded_keywords = result.get("keywords", [])
                    status_filter = result.get("status_filter")
                    if status_filter == "null" or status_filter is None:
                        status_filter = None
            except Exception as e:
                logger.error(f"Gemini query expansion failed: {e}")

        # Fallback / standard keywords
        base_keywords = [k.strip().lower() for k in query.split() if len(k.strip()) > 2]
        if not base_keywords:
            base_keywords = [query.lower()]

        # Combine keywords
        all_keywords = list(set(base_keywords + [kw.lower() for kw in expanded_keywords]))

        # Initialize collections of matching entity IDs
        matched_meetings = set()
        matched_decisions = set()
        matched_actions = set()
        matched_risks = set()

        # Step 2: Search database using keywords and status filter
        for kw in all_keywords:
            # Meetings matching keyword
            meetings = db.query(Meeting).filter(
                or_(Meeting.title.like(f"%{kw}%"), Meeting.transcript.like(f"%{kw}%"), Meeting.summary.like(f"%{kw}%"))
            ).all()
            for m in meetings:
                matched_meetings.add(m.meeting_id)

            # Decisions matching keyword
            decisions = db.query(Decision).filter(Decision.description.like(f"%{kw}%")).all()
            for d in decisions:
                matched_decisions.add(d.decision_id)
                if d.meeting_id:
                    matched_meetings.add(d.meeting_id)

            # Actions matching keyword (+ status filter)
            if status_filter:
                actions = db.query(Action).filter(
                    Action.status == status_filter,
                    or_(Action.task.like(f"%{kw}%"), Action.owner.like(f"%{kw}%"))
                ).all()
            else:
                actions = db.query(Action).filter(
                    or_(Action.task.like(f"%{kw}%"), Action.owner.like(f"%{kw}%"))
                ).all()
                
            for a in actions:
                matched_actions.add(a.action_id)
                if a.meeting_id:
                    matched_meetings.add(a.meeting_id)

            # Risks matching keyword
            risks = db.query(Risk).filter(Risk.description.like(f"%{kw}%")).all()
            for r in risks:
                matched_risks.add(r.risk_id)
                if r.meeting_id:
                    matched_meetings.add(r.meeting_id)

        # Pull all actions with matching status if user searched specifically for status but no kw matched
        if status_filter and not matched_actions:
            actions = db.query(Action).filter(Action.status == status_filter).all()
            for a in actions:
                matched_actions.add(a.action_id)
                if a.meeting_id:
                    matched_meetings.add(a.meeting_id)

        # Step 3: Traverse graph edges to pull related entities
        if matched_meetings:
            edges = db.query(GraphEdge).filter(
                GraphEdge.source_type == "meeting",
                GraphEdge.source_id.in_(list(matched_meetings))
            ).all()
            for edge in edges:
                if edge.target_type == "decision":
                    matched_decisions.add(edge.target_id)
                elif edge.target_type == "action":
                    matched_actions.add(edge.target_id)
                elif edge.target_type == "risk":
                    matched_risks.add(edge.target_id)

        # Fetch actual DB objects from matched IDs
        results = {
            "meetings": db.query(Meeting).filter(Meeting.meeting_id.in_(list(matched_meetings))).all() if matched_meetings else [],
            "decisions": db.query(Decision).filter(Decision.decision_id.in_(list(matched_decisions))).all() if matched_decisions else [],
            "actions": db.query(Action).filter(Action.action_id.in_(list(matched_actions))).all() if matched_actions else [],
            "risks": db.query(Risk).filter(Risk.risk_id.in_(list(matched_risks))).all() if matched_risks else []
        }
        
        return results
