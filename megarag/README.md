<div align="center">

# MegaRAG

<img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
<img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
<img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
<img src="https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=for-the-badge&logo=google" alt="Gemini" />

### Upload Anything. Query Everything. Get Answers with Sources.

A production-ready multi-modal RAG system that processes PDFs, images, videos, audio, and documents - then lets you chat with your data using AI.

[Demo](#demo) • [Quick Start](#-quick-start) • [Features](#-features) • [API Docs](API_DOCUMENTATION.md) • [Architecture](ARCHITECTURE.md)

---

**Works with:** PDF, DOCX, PPTX, XLSX, TXT, MD, PNG, JPG, GIF, WebP, MP4, WebM, MOV, MP3, WAV, FLAC, and more

</div>

---

## What You Get

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   📁 Upload ANY file    →    🔍 AI extracts content    →    💬 Chat   │
│                                                                        │
│   • Drag & drop upload       • Auto-chunking              • 5 query   │
│   • Bulk uploads             • Entity extraction            modes     │
│   • Progress tracking        • Knowledge graph           • Sources    │
│   • Multi-format             • Vector embeddings         • Citations  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

- **Dashboard** - Upload files, see processing status, manage documents
- **Chat Interface** - Query your documents with AI, get cited answers
- **Data Explorer** - Browse extracted entities, relationships, and chunks
- **Dark Mode** - Full dark/light theme support
- **Global Search** - `Cmd+K` to search anything instantly

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Purpose | Get it |
|-------------|---------|--------|
| **Node.js 18+** | Runtime | [nodejs.org](https://nodejs.org/) |
| **Supabase Account** | Database + Storage | [supabase.com](https://supabase.com/) (free tier works!) |
| **Google AI API Key** | Gemini for AI | [aistudio.google.com](https://aistudio.google.com/apikey) |

### Step 1: Clone & Install

```bash
git clone https://github.com/promptadvisers/megarag.git
cd megarag
npm install
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for it to be ready (~2 minutes)
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 3: Set Up Database

Go to **SQL Editor** in Supabase and run these SQL commands **in order**:

<details>
<summary><b>1. Enable pgvector extension</b></summary>

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
</details>

<details>
<summary><b>2. Create documents table</b></summary>

```sql
CREATE TABLE documents (
    id VARCHAR(255) PRIMARY KEY,
    workspace VARCHAR(255) DEFAULT 'default',
    file_name VARCHAR(1024) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    file_path TEXT,
    status VARCHAR(64) DEFAULT 'pending',
    chunks_count INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_file_type ON documents(file_type);
```
</details>

<details>
<summary><b>3. Create chunks table</b></summary>

```sql
CREATE TABLE chunks (
    id VARCHAR(255) PRIMARY KEY,
    workspace VARCHAR(255) DEFAULT 'default',
    document_id VARCHAR(255) REFERENCES documents(id) ON DELETE CASCADE,
    chunk_order_index INTEGER,
    content TEXT NOT NULL,
    content_vector VECTOR(768),
    tokens INTEGER,
    chunk_type VARCHAR(50) DEFAULT 'text',
    page_idx INTEGER,
    timestamp_start FLOAT,
    timestamp_end FLOAT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chunks_vector ON chunks
USING hnsw (content_vector vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```
</details>

<details>
<summary><b>4. Create entities table</b></summary>

```sql
CREATE TABLE entities (
    id VARCHAR(255) PRIMARY KEY,
    workspace VARCHAR(255) DEFAULT 'default',
    entity_name VARCHAR(512) NOT NULL,
    entity_type VARCHAR(128),
    description TEXT,
    content_vector VECTOR(768),
    source_chunk_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entities_name ON entities(entity_name);
CREATE INDEX idx_entities_vector ON entities
USING hnsw (content_vector vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```
</details>

<details>
<summary><b>5. Create relations table</b></summary>

```sql
CREATE TABLE relations (
    id VARCHAR(255) PRIMARY KEY,
    workspace VARCHAR(255) DEFAULT 'default',
    source_entity_id VARCHAR(512),
    target_entity_id VARCHAR(512),
    relation_type VARCHAR(256),
    description TEXT,
    content_vector VECTOR(768),
    source_chunk_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_relations_source ON relations(source_entity_id);
CREATE INDEX idx_relations_target ON relations(target_entity_id);
CREATE INDEX idx_relations_vector ON relations
USING hnsw (content_vector vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```
</details>

<details>
<summary><b>6. Create search functions</b></summary>

```sql
-- Search chunks by vector similarity
CREATE OR REPLACE FUNCTION search_chunks(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 10
) RETURNS TABLE (
    id VARCHAR,
    document_id VARCHAR,
    content TEXT,
    chunk_type VARCHAR,
    similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.document_id, c.content, c.chunk_type,
           1 - (c.content_vector <=> query_embedding) AS similarity
    FROM chunks c
    WHERE c.content_vector IS NOT NULL
      AND 1 - (c.content_vector <=> query_embedding) > match_threshold
    ORDER BY c.content_vector <=> query_embedding
    LIMIT match_count;
END; $$;

-- Search entities by vector similarity
CREATE OR REPLACE FUNCTION search_entities(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 20
) RETURNS TABLE (
    id VARCHAR,
    entity_name VARCHAR,
    entity_type VARCHAR,
    description TEXT,
    similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT e.id, e.entity_name, e.entity_type, e.description,
           1 - (e.content_vector <=> query_embedding) AS similarity
    FROM entities e
    WHERE e.content_vector IS NOT NULL
      AND 1 - (e.content_vector <=> query_embedding) > match_threshold
    ORDER BY e.content_vector <=> query_embedding
    LIMIT match_count;
END; $$;

-- Search relations by vector similarity
CREATE OR REPLACE FUNCTION search_relations(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 20
) RETURNS TABLE (
    id VARCHAR,
    source_entity_id VARCHAR,
    target_entity_id VARCHAR,
    relation_type VARCHAR,
    description TEXT,
    similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.source_entity_id, r.target_entity_id, r.relation_type, r.description,
           1 - (r.content_vector <=> query_embedding) AS similarity
    FROM relations r
    WHERE r.content_vector IS NOT NULL
      AND 1 - (r.content_vector <=> query_embedding) > match_threshold
    ORDER BY r.content_vector <=> query_embedding
    LIMIT match_count;
END; $$;
```
</details>

<details>
<summary><b>7. Create storage bucket</b></summary>

Go to **Storage** in Supabase dashboard:
1. Click **New bucket**
2. Name it `documents`
3. Keep it **private** (not public)
4. Set file size limit to **100MB**
</details>

### Step 4: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google AI (from aistudio.google.com/apikey)
GOOGLE_AI_API_KEY=AIzaSy...
```

### Step 5: Run!

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and start uploading files!

---

## ✨ Features

### File Processing

| File Type | What Happens |
|-----------|--------------|
| **PDF, DOCX, PPTX, XLSX** | Gemini extracts text, tables, and images → chunks with embeddings |
| **Images** (PNG, JPG, GIF, WebP) | Gemini Vision describes the image → searchable text |
| **Video** (MP4, WebM, MOV) | Gemini analyzes video → timestamped segment descriptions |
| **Audio** (MP3, WAV, FLAC) | Gemini transcribes → text chunks |
| **Text** (TXT, MD) | Smart chunking (800 tokens, 100 overlap) |

### Query Modes

| Mode | Description | When to Use |
|------|-------------|-------------|
| **Naive** | Direct vector search on chunks | Simple factual questions |
| **Local** | Find entities → get related chunks | "Who is X?" "What is Y?" |
| **Global** | Traverse relationships | "How does A relate to B?" |
| **Hybrid** | Local + Global combined | Complex multi-hop questions |
| **Mix** | All of the above | General use (default) |

### Knowledge Graph

Every document automatically extracts:
- **Entities**: People, Organizations, Locations, Events, Concepts, Technologies, Products, Dates
- **Relationships**: Works for, Founded, Located in, Created, Related to, etc.

### UI Features

- **Bulk Uploads**: Upload multiple files with parallel processing
- **Progress Tracking**: Real-time progress bars per file
- **Document Filters**: Search + status filters (Ready/Processing/Failed)
- **Batch Delete**: Multi-select with 5-second undo
- **Global Search**: `Cmd+K` to search everything
- **Chat Rename**: Inline rename of chat sessions
- **Copy Buttons**: One-click copy for messages and sources
- **Dark Mode**: System-aware theme switching

---

## 📖 API Reference

### Upload a File

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf"
```

### Query Documents

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main topics discussed?",
    "mode": "mix"
  }'
```

### Response Format

```json
{
  "response": "Based on the documents, the main topics are... [Source 1] [Source 2]",
  "sources": [
    {
      "id": "chunk-123",
      "content": "Relevant excerpt...",
      "document_name": "report.pdf",
      "similarity": 0.89
    }
  ],
  "entities": [
    { "name": "Machine Learning", "type": "CONCEPT" }
  ]
}
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for the complete API reference.

---

## 🏗️ Project Structure

```
megarag/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── upload/             # POST /api/upload
│   │   │   ├── documents/          # GET/DELETE /api/documents
│   │   │   ├── query/              # POST /api/query
│   │   │   ├── chat/               # Chat session management
│   │   │   └── search/             # Global search
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Main dashboard
│   │   │   ├── chat/page.tsx       # Chat interface
│   │   │   └── explorer/page.tsx   # Data explorer
│   │   └── page.tsx                # Landing page
│   │
│   ├── components/
│   │   ├── DocumentUploader.tsx    # Drag-drop upload with progress
│   │   ├── DocumentList.tsx        # File list with filters
│   │   ├── ChatInterface.tsx       # Chat UI
│   │   ├── ChatMessage.tsx         # Message with sources
│   │   ├── CommandPalette.tsx      # Cmd+K global search
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── gemini/
│   │   │   ├── client.ts           # Gemini AI client
│   │   │   └── embeddings.ts       # text-embedding-004
│   │   ├── processing/
│   │   │   ├── router.ts           # File type → processor
│   │   │   ├── text-processor.ts   # TXT/MD
│   │   │   ├── image-processor.ts  # Images via Vision
│   │   │   ├── video-processor.ts  # Video via File API
│   │   │   └── audio-processor.ts  # Audio transcription
│   │   ├── rag/
│   │   │   ├── retriever.ts        # Multi-mode retrieval
│   │   │   └── response-generator.ts
│   │   └── supabase/
│   │       ├── client.ts           # Browser client
│   │       └── server.ts           # Server client
│   │
│   └── types/
│       └── index.ts                # TypeScript definitions
│
├── .env.example                    # Environment template
├── ARCHITECTURE.md                 # System architecture docs
├── API_DOCUMENTATION.md            # API reference
└── CONVERSATION_LOG.md             # Development history
```

---

## ⚙️ Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Required |
| `GOOGLE_AI_API_KEY` | Gemini API key | Required |
| `CHUNK_SIZE_TOKENS` | Tokens per chunk | 800 |
| `CHUNK_OVERLAP_TOKENS` | Overlap between chunks | 100 |
| `ENABLE_ENTITY_EXTRACTION` | Extract knowledge graph | true |
| `MAX_FILE_SIZE_MB` | Max upload size | 100 |

---

## 🚨 Troubleshooting

### "Invalid API key"

- Check your `GOOGLE_AI_API_KEY` is correct
- Make sure you're using a Gemini API key from [aistudio.google.com](https://aistudio.google.com/apikey)

### "Table doesn't exist"

- Run all the SQL commands from Step 3 in order
- Make sure pgvector extension is enabled first

### Files stuck in "Processing"

- Check the browser console for errors
- Verify your Supabase service role key has write access
- For large files, processing can take 1-2 minutes

### "CORS error"

- Make sure you're running on `localhost:3000`
- Check Supabase project URL matches exactly

### Video/Audio not processing

- Gemini File API has limits: 1GB for video, 9.5 hours for audio
- Files are uploaded to Gemini, processed, then deleted

---

## 🚀 Deploy

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/promptadvisers/megarag)

1. Click the button above
2. Add environment variables in Vercel dashboard
3. Deploy!

### Manual Deploy

```bash
npm run build
npm start
```

---

## 📚 Learn More

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture with ASCII diagrams
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [CONVERSATION_LOG.md](CONVERSATION_LOG.md) - Development history and decisions

---

## 🤝 Contributing

Contributions welcome! Please read the codebase first - it's well-documented.

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

---

## 📄 License

MIT License - use it for anything!

---

<div align="center">

**Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), and [Gemini](https://ai.google.dev)**

Made with ❤️ by [Prompt Advisers](https://github.com/promptadvisers)

</div>
