# Hermes: Project Governance Brain

> **Phase 1 - ANURAG**

Hermes is an AI-powered project governance dashboard designed to ingest meeting transcripts, extract actionable intelligence (Decisions, Actions, Risks), and provide real-time reporting metrics.

## 🚀 Phase 1 Achievements

During Phase 1, the foundational architecture of the Hermes Project Governance Brain was successfully established. The following features were built:

1. **Next.js Frontend Shell:**
   - Designed a modern, premium "glassmorphic" dark-mode UI.
   - Built a fully interactive Sidebar, Dashboard, Actions Kanban board, Reports page, and an interactive Agent Skills marketplace.
   - Built a ChatGPT-style conversational interface (Hermes Chat) with mock queries.

2. **FastAPI Backend Integration:**
   - Integrated with a local **PostgreSQL** database for robust, persistent data storage.
   - Built a dedicated FastAPI routing layer to serve Meetings, Actions, and Risks.
   - Seeded the database with realistic dummy sprint and architecture meeting data.

3. **GBrain Transcript Ingestion (Real-Time):**
   - Built an interactive **+ New Meeting** modal.
   - Integrated the Next.js frontend with the FastAPI backend using **Server-Sent Events (SSE)**.
   - Simulated the AI extraction process, allowing users to watch the GBrain stream real-time status updates ("Generating Knowledge Graph", "Extracting Actions") directly in the UI as the backend parses the transcript.

---

## 💻 Local Setup Instructions

Ensure your local PostgreSQL database is running (default credentials: `postgres` with password `Monunag22`).

### 1. Start the Backend (FastAPI)
The backend uses Python. We have provided a helper script to automatically create a virtual environment, install dependencies, seed the database, and start the server.

Open a PowerShell terminal and run:
```powershell
cd backend
.\start_backend.ps1
```
*(The API will be available at `http://localhost:8000`)*

### 2. Start the Frontend (Next.js)
The frontend uses Node.js and Next.js 15+ (App Router).

Open a **second** terminal and run:
```powershell
cd frontend
npm install
npm run dev
```
*(The UI will be available at `http://localhost:3000`)*

> **Note on `.env` file:** The `backend/.env` file is configured with the PostgreSQL connection string pointing to localhost. Make sure your local PostgreSQL database is running and matching the connection credentials.

---

## 👥 Project Team

**Phase 1** was conceptualized and driven by **Anurag**.

### Contributors
* [Anurag](https://github.com/Anurag) (Lead)
* [Shasha004](https://github.com/Shasha004)
* [PreritNag](https://github.com/PreritNag)
