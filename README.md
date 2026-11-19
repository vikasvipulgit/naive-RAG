# Naive RAG Studio (React + Python)

A full-stack, visual, and interactive implementation of **Naive Retrieval-Augmented Generation (Naive RAG)** built with **FastAPI (Python)** and **React (Vite + Tailwind CSS)**.

This application provides a complete, production-ready workbench for understanding, experimenting with, and deploying the canonical Naive RAG architecture.

---

## 🌟 What is Naive RAG?

**Naive RAG** is the foundational paradigm of Retrieval-Augmented Generation that bridges the gap between external private documents and Large Language Models. It follows a direct, sequential 3-stage pipeline:

```
[Documents: PDF/TXT/MD] 
      │
      ▼  (Phase 1: Indexing)
[Sliding-Window Chunking] ──► [Dense Embedding Vectors] ──► [Cosine Vector Store]
                                                                   │
User Query ──────────────────► [Query Embedding] ───────────────────┤
                                                                   ▼  (Phase 2: Retrieval)
                                                           [Top-K Nearest Chunks]
                                                                   │
                                                                   ▼  (Phase 3: Generation)
                                                      [Augmented System Prompt] ──► [LLM Answer]
```

### 1. Indexing (Document Preparation & Vector Storage)
- **Document Loading**: Ingestion of raw documents (`.pdf`, `.txt`, `.md`, `.json`, `.csv`).
- **Fixed-Window Chunking**: Splits documents into fixed-size character windows (e.g. 500 characters) with a configurable sliding overlap (e.g. 100 characters) to preserve contextual boundaries.
- **Dense Embeddings**: Converts chunks into dense, normalized vectors capturing semantic meaning.
- **Vector Store**: Indexes vectors and chunk metadata for sub-millisecond retrieval using exact **Cosine Similarity**:
  $$\text{sim}(\mathbf{q}, \mathbf{d}) = \frac{\mathbf{q} \cdot \mathbf{d}}{\|\mathbf{q}\|_2 \|\mathbf{d}\|_2}$$

### 2. Retrieval (Vector Similarity Search)
- User query is transformed into an embedding vector using the matching model.
- Vector dot-product search ranks all stored chunks by cosine similarity.
- Top-K most relevant chunks exceeding a similarity threshold are retrieved.

### 3. Generation (Prompt Augmentation & Grounded Synthesis)
- Retrieved chunks are concatenated into a strict system prompt template:
  > *"Answer the question using ONLY the provided reference context. If the answer cannot be found, say so. Do not hallucinate."*
- An LLM synthesizes a grounded answer with verifiable citations directly referencing the source chunks.

---

## ✨ Features

- **Interactive Visual Pipeline**: Explore each stage of the Naive RAG pipeline with live metric indicators.
- **Sliding-Window Chunk Inspector**: Visual breakdown of documents showing chunk IDs, start/end character offsets, token estimates, and highlighted overlap regions.
- **Vector Retrieval Playground**: Test the retrieval stage in isolation with similarity score progress bars, rank badges, and query latency measurements in milliseconds.
- **Grounded Chat with Prompt Inspector**:
  - Live chat grounded in your knowledge base.
  - **Compare with Blind LLM (No Context)**: Toggle side-by-side comparison to see firsthand how Naive RAG eliminates hallucinations compared to standard ungrounded LLM responses.
  - **Raw Augmented Prompt Viewer**: View the exact system prompt and injected context sent to the model.
  - Collapsible source chunk citations with similarity scores.
- **Multi-Provider Support**:
  - **Local Offline Engine (Default)**: Runs 100% locally and offline out-of-the-box with **zero API keys required** using subword n-gram hashed dense vector projection and extractive QA synthesis.
  - **Google Gemini**: Connect `text-embedding-004` and `gemini-2.5-flash` / `gemini-1.5-flash` via API key.
  - **OpenAI**: Connect `text-embedding-3-small` and `gpt-4o-mini` / `gpt-4o` via API key.
- **Document Ingestion**: Drag-and-drop support for PDF, plain text, Markdown, JSON, and CSV.
- **1-Click Sample Knowledge Base**: Instantly loads pre-built articles on Artificial Intelligence and Apollo 11.

---

## 📁 Repository Structure

```
naive-RAG/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI endpoints (Upload, Index, Retrieve, Query, Settings)
│   │   ├── config.py            # Environment configuration
│   │   ├── models.py            # Pydantic data schemas
│   │   ├── document_loader.py   # Multi-format document parser (PDF, TXT, MD, CSV, JSON)
│   │   ├── chunker.py           # Naive fixed sliding-window chunker
│   │   ├── embeddings.py        # Embedding providers (Local Dense Vectorizer, Gemini, OpenAI)
│   │   ├── vector_store.py      # Cosine similarity vector store
│   │   ├── generator.py         # Prompt augmentation & LLM synthesis
│   │   └── rag_pipeline.py      # Central orchestrator connecting all components
│   ├── sample_docs/             # Pre-built documents for instant testing
│   │   ├── artificial_intelligence.txt
│   │   └── apollo_11_mission.txt
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   └── .env                     # Local configuration
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main React application & state management
│   │   ├── components/
│   │   │   ├── Header.jsx               # Quick stats, navigation tabs, actions
│   │   │   ├── PipelineVisualizer.jsx   # Interactive architectural diagram
│   │   │   ├── DocumentManager.jsx      # File upload & document list
│   │   │   ├── ChunkInspector.jsx       # Sliding-window chunk & overlap visualizer
│   │   │   ├── RetrievalPlayground.jsx  # Isolated vector search playground
│   │   │   ├── ChatInterface.jsx        # Grounded Q&A chat & prompt inspector
│   │   │   └── SettingsModal.jsx        # Hyperparameter & provider configuration
│   │   ├── services/
│   │   │   └── api.js                   # API client
│   │   ├── main.jsx
│   │   └── index.css                    # Tailwind CSS styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── run.sh                       # One-command startup script
└── README.md
```

---

## 🚀 Quickstart

### Method 1: One-Command Startup (Recommended)

Run the automated launcher script from the root directory:

```bash
chmod +x run.sh
./run.sh
```

This starts:
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000) (Swagger docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs))
- **React Frontend**: [http://localhost:3000](http://localhost:3000)

---

### Method 2: Manual Setup

#### Step 1: Start the Backend (Python FastAPI)

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Uvicorn server:
   ```bash
   PYTHONPATH=. uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

#### Step 2: Start the Frontend (React + Vite)

1. In a second terminal, navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## ⚙️ Configuration & API Keys

The application works completely offline with **zero configuration or external keys**.

If you wish to use cloud models:
1. Click the **"Settings"** button in the top navigation bar.
2. Select **Google Gemini** or **OpenAI** as your Embedding or LLM Provider.
3. Paste your API key:
   - Gemini API Key: `AIzaSy...`
   - OpenAI API Key: `sk-...`
4. Click **"Save & Apply Re-indexing"**.

You can also adjust hyperparameter sliders in real time:
- **Chunk Size** (100 to 2000 characters)
- **Chunk Overlap** (0 to 500 characters)
- **Top-K Chunks** (1 to 10 chunks)
- **Min Similarity Cutoff** (0.0 to 0.8)

---

## 🧪 Testing the Application

1. Open the UI at `http://localhost:3000`.
2. Click **"Load Samples"** in the top bar to ingest the Apollo 11 and Artificial Intelligence articles.
3. Switch to the **"Chunk Inspector"** tab to inspect how the documents were sliced into overlapping windows.
4. Switch to the **"Vector Retrieval Playground"** tab and search:
   - *"Who was the commander of Apollo 11?"*
   - Note the similarity scores and search latency (~0.3 ms).
5. Switch to the **"Chat & Generation"** tab:
   - Turn on the **"Compare with Blind LLM (No Context)"** toggle.
   - Ask: *"What were the three distinct modules of Apollo 11?"*
   - Observe how Naive RAG cites the exact text chunks while grounding the response.
