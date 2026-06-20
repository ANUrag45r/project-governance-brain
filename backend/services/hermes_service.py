import re
import datetime
import json
import logging
from typing import Dict, List, Any
import httpx
from config import settings

logger = logging.getLogger("hermes")

class HermesService:
    def analyze_meeting(self, title: str, transcript: str) -> Dict[str, Any]:
        """
        Analyzes a transcript using Gemini API (if available) or local NLP rules to extract:
        - A contextual summary
        - Decisions (description, owner)
        - Action items (task, owner, status, due_date)
        - Risks (description, severity)
        """
        logger.info(f"Hermes analyzing transcript for meeting: {title}")
        
        # 1. Try Gemini Integration
        if settings.GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                prompt = f"""
Analyze the following meeting transcript for the meeting titled "{title}".
You must output a single JSON object containing:
1. "summary": A brief narrative summary of the meeting.
2. "decisions": A list of decisions made, where each has "description" and "owner" (e.g., a person's name or "Team").
3. "actions": A list of action items, where each has "task" (description of the task), "owner" (person's name or "Unassigned"), "status" (always "Open"), and "due_date" (formatted as "YYYY-MM-DD", estimating a reasonable due date if not explicitly mentioned, e.g. 3 to 7 days from now).
4. "risks": A list of risks or blockers identified, where each has "description" and "severity" ("High", "Medium", or "Low").

Transcript:
{transcript}

Ensure your response is valid JSON and strictly adheres to the schema below:
{{
  "summary": "...",
  "decisions": [
    {{"description": "...", "owner": "..."}}
  ],
  "actions": [
    {{"task": "...", "owner": "...", "status": "Open", "due_date": "YYYY-MM-DD"}}
  ],
  "risks": [
    {{"description": "...", "severity": "High|Medium|Low"}}
  ]
}}
"""
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ],
                    "generationConfig": {
                        "responseMimeType": "application/json"
                    }
                }
                
                response = httpx.post(url, json=payload, timeout=30.0)
                if response.status_code == 200:
                    res_data = response.json()
                    text_response = res_data['candidates'][0]['content']['parts'][0]['text']
                    result = json.loads(text_response)
                    
                    # Convert due_date strings back to datetime.datetime objects
                    parsed_actions = []
                    for act in result.get("actions", []):
                        due_date_val = datetime.datetime.now() + datetime.timedelta(days=3)
                        if act.get("due_date"):
                            try:
                                due_date_val = datetime.datetime.strptime(act["due_date"], "%Y-%m-%d")
                            except Exception:
                                pass
                        parsed_actions.append({
                            "task": act.get("task", "Define milestones"),
                            "owner": act.get("owner", "Unassigned"),
                            "status": act.get("status", "Open"),
                            "due_date": due_date_val
                        })
                    
                    return {
                        "summary": result.get("summary", ""),
                        "decisions": result.get("decisions", []),
                        "actions": parsed_actions,
                        "risks": result.get("risks", [])
                    }
                else:
                    logger.error(f"Gemini API request failed with status {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"Gemini analysis failed, using local fallback NLP rules: {e}")

        # 2. Rule-based local NLP Fallback
        lines = [line.strip() for line in transcript.split('\n') if line.strip()]
        
        decisions = []
        actions = []
        risks = []
        
        names = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace"]
        
        def find_owner(text: str, default: str = "Unassigned") -> str:
            for name in names:
                if re.search(r'\b' + re.escape(name) + r'\b', text, re.IGNORECASE):
                    return name
            return default

        def find_due_date(text: str) -> datetime.datetime:
            date_match = re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}\b', text, re.IGNORECASE)
            if date_match:
                try:
                    date_str = f"{date_match.group(0)} {datetime.datetime.now().year}"
                    return datetime.datetime.strptime(date_str, "%b %d %Y")
                except Exception:
                    pass
            if "next week" in text.lower():
                return datetime.datetime.now() + datetime.timedelta(days=7)
            return datetime.datetime.now() + datetime.timedelta(days=3)

        for line in lines:
            line_lower = line.lower()
            
            if any(p in line_lower for p in ["decide", "decided", "decision:", "agreed on", "approve"]):
                desc = line
                if ":" in line:
                    desc = line.split(":", 1)[1].strip()
                owner = find_owner(line, "Team")
                decisions.append({
                    "description": desc,
                    "owner": owner
                })
                
            elif any(p in line_lower for p in ["will setup", "will draft", "action:", "task:", "todo:", "assign to", "assigned to", "i will"]):
                task = line
                if ":" in line:
                    task = line.split(":", 1)[1].strip()
                owner = find_owner(line, "Unassigned")
                task = re.sub(r'^(i|we|he|she)\s+will\s+', '', task, flags=re.IGNORECASE)
                actions.append({
                    "task": task,
                    "owner": owner,
                    "status": "Open",
                    "due_date": find_due_date(line)
                })

            elif any(p in line_lower for p in ["risk", "blocker", "hazard", "concern", "delay", "danger", "instability"]):
                desc = line
                if ":" in line:
                    desc = line.split(":", 1)[1].strip()
                
                severity = "Medium"
                if "high" in line_lower or "critical" in line_lower or "severe" in line_lower:
                    severity = "High"
                elif "low" in line_lower or "minor" in line_lower:
                    severity = "Low"
                    
                risks.append({
                    "description": desc,
                    "severity": severity
                })

        if not decisions:
            decisions.append({
                "description": f"Proceed with core initiatives defined in {title}",
                "owner": "Team"
            })
        if not actions:
            actions.append({
                "task": f"Define detailed milestones for {title}",
                "owner": "Unassigned",
                "status": "Open",
                "due_date": datetime.datetime.now() + datetime.timedelta(days=5)
            })
        if not risks:
            risks.append({
                "description": f"Potential alignment gaps regarding {title} scope",
                "severity": "Medium"
            })

        summary = f"This meeting focused on discussions and deliverables for '{title}'. "
        if decisions:
            summary += f"The team reached decisions regarding: {', '.join([d['description'][:40] + '...' for d in decisions])}. "
        if actions:
            summary += f"Key next steps were assigned, including tasks for {', '.join([a['owner'] for a in actions if a['owner'] != 'Unassigned'])}. "
        if risks:
            summary += f"The team identified operational risks such as: {', '.join([r['description'][:40] + '...' for r in risks])}."

        return {
            "summary": summary,
            "decisions": decisions,
            "actions": actions,
            "risks": risks
        }

    def synthesize_query_response(self, query: str, graph_context: dict) -> str:
        """
        Synthesizes a response to the user's natural language query using Gemini (if available)
        or local rule-based templating.
        """
        meetings = graph_context.get("meetings", [])
        decisions = graph_context.get("decisions", [])
        actions = graph_context.get("actions", [])
        risks = graph_context.get("risks", [])

        # 1. Try Gemini Integration
        if settings.GEMINI_API_KEY:
            try:
                context_str = ""
                if meetings:
                    context_str += "Meetings:\n" + "\n".join([f"- Title: {m.title}, Date: {m.created_at}, Summary: {m.summary}" for m in meetings]) + "\n\n"
                if decisions:
                    context_str += "Decisions:\n" + "\n".join([f"- Description: {d.description}, Owner: {d.owner}" for d in decisions]) + "\n\n"
                if actions:
                    context_str += "Action Items:\n" + "\n".join([f"- Task: {a.task}, Owner: {a.owner}, Status: {a.status}, Due Date: {a.due_date}" for a in actions]) + "\n\n"
                if risks:
                    context_str += "Risks:\n" + "\n".join([f"- Description: {r.description}, Severity: {r.severity}" for r in risks]) + "\n\n"

                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                prompt = f"""
You are Hermes, the Project Governance Brain AI.
You have access to the following relevant data from the project's knowledge graph context:
{context_str}

Please synthesize a natural language response to the user's query: "{query}".
You must structure the response in clean, easy-to-read markdown.
Highlight key meetings, decisions, active actions, and risks. Keep the tone professional, helpful, and concise.

If the context is completely empty and no relevant items were found, state that clearly and suggest what they can ask about.
"""
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                }
                
                response = httpx.post(url, json=payload, timeout=30.0)
                if response.status_code == 200:
                    res_data = response.json()
                    answer = res_data['candidates'][0]['content']['parts'][0]['text']
                    return answer
                else:
                    logger.error(f"Gemini Query synthesis failed: {response.text}")
            except Exception as e:
                logger.error(f"Gemini query synthesis failed, falling back to rule-based synthesis: {e}")

        # 2. Rule-based local templating fallback
        if not meetings and not decisions and not actions and not risks:
            return "I couldn't find any relevant meetings, decisions, or actions in your project governance memory matching that query. Try asking about 'Sprint 12', 'OAuth', 'overdue actions', or 'risks'."

        response = f"### Governance Brain Search Results\n"
        response += f"Here is what I found in your organizational memory regarding **\"{query}\"**:\n\n"

        if meetings:
            response += "#### 📅 Relevant Meetings\n"
            for m in meetings:
                date_str = m.created_at.strftime("%b %d, %Y") if m.created_at else "Unknown Date"
                response += f"- **{m.title}** ({date_str} - {m.source})\n"
                response += f"  *Summary:* {m.summary}\n"
            response += "\n"

        if decisions:
            response += "#### 📝 Decisions Recorded\n"
            for d in decisions:
                meeting_title = "Unknown Sync"
                for m in meetings:
                    if m.meeting_id == d.meeting_id:
                        meeting_title = m.title
                        break
                response += f"- **Decision**: {d.description}\n"
                response += f"  *Owner:* {d.owner} | *Meeting:* {meeting_title}\n"
            response += "\n"

        if actions:
            response += "#### ⚡ Action Items & Status\n"
            for a in actions:
                due_str = a.due_date.strftime("%b %d, %Y") if a.due_date else "No due date"
                status_color = "🔴 Overdue" if a.status == "Overdue" else "🟢 Done" if a.status == "Done" else "🟡 In Progress" if a.status == "In Progress" else "🔵 Open"
                response += f"- **{a.task}**\n"
                response += f"  *Assignee:* {a.owner} | *Status:* {status_color} | *Due:* {due_str}\n"
            response += "\n"

        if risks:
            response += "#### ⚠️ Risks Identified\n"
            for r in risks:
                sev_emoji = "🔴" if r.severity == "High" else "🟡" if r.severity == "Medium" else "🔵"
                response += f"- {sev_emoji} **{r.description}** (Severity: **{r.severity}**)\n"
            response += "\n"

        response += "---\n"
        response += "*Note: This context was synthesized by traversals across meetings, owners, and decisions in the GBrain memory graph.*"

        return response
