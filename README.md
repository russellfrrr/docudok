# DocuDok

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-DC244C?logo=qdrant&logoColor=white)

> A personal learning project exploring RAG-powered web applications.
> Built mostly out of curiosity, obsession, and the desire to understand how modern AI apps actually work under the hood.

**MVP Status:** Working document upload, RAG processing, vector search, and document chat.

**Main Learning Goal:** The RAG Magic. That's it.

---

## What Is This?

DocuDok is my sandbox for experimenting with:

- Retrieval-Augmented Generation (RAG)
- Vector search and embeddings
- Full-stack TypeScript workflows
- Advanced MERN architecture
- AI-assisted product design
- Real-world SaaS patterns
- Modern UI/UX architecture

Right now, it is mainly a learning/passion project.

The current app lets users upload PDF documents, process them into chunks, store embeddings in a vector database, and chat with the document using retrieved context.

Long term, I would like to evolve this into something more production-ready and potentially turn it into a small SaaS product.

So expect:

- random architecture changes
- questionable commits at 2AM
- overengineering
- underengineering
- and occasional moments of accidental genius

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose
- **AI / RAG:** OpenAI-compatible chat + embeddings, LangChain text splitters
- **AI Client:** Shared OpenAI SDK client configured with `OPENAI_API_KEY` and optional `OPENAI_BASE_URL`
- **Vector DB:** Qdrant
- **File Uploads:** Multer
- **PDF Parsing:** pdf-parse
- **Auth:** JWT
- **Styling:** Tailwind CSS, shadcn/Radix-style components
- **Client State/Data:** TanStack Query, Zustand, Axios
- **UI Details:** Lucide icons, Motion

---

## Features

- [x] Register/login authentication
- [x] JWT-protected routes
- [x] Auth input validation and basic rate limiting
- [x] PDF upload
- [x] Document title and question validation
- [x] Background document processing
- [x] PDF text extraction
- [x] Text cleanup and chunking
- [x] PDF artifact cleanup for cleaner chunks
- [x] LangChain-powered text splitting
- [x] Embedding generation
- [x] Vector storage with Qdrant
- [x] Semantic search
- [x] Context-aware document chat
- [x] Source snippets
- [x] Copyable source snippets
- [x] Chunk inspector
- [x] Chunk word and character metrics
- [x] Retrieval playground for testing search quality
- [x] Saved chat history
- [x] Delete documents and related data
- [x] Retry failed document processing
- [x] Visible processing error details for failed uploads
- [x] Route-level frontend code splitting
- [ ] Cleaner source snippet UI
- [ ] Streaming responses
- [ ] OAuth login
- [ ] Multi-file or workspace support
- [ ] Billing/subscriptions
- [ ] Production deployment
- [ ] Whatever future me decides to obsess over next

---

## Why I Built This

Honestly?

I was bored af and ended up falling into the RAG rabbit hole.

The whole idea of giving LLMs actual context instead of letting them hallucinate and telling me that the world is ending is so fuckin interesting to me. Once I started learning how retrival pipelines, embeddings, chunking, vector dbs, and context injection worked together, I got addicted.

This repo is my attempt to:

- build something while learning
- break things intentionally
- understand AI systems much MUCH more BETTER
- experiment with architectures and workflows


If it breaks, that is part of the lore.

---

## How The RAG Pipeline Works

```txt
PDF Upload
   -> Extract text
   -> Clean messy PDF text
   -> Split text into chunks
   -> Generate embeddings
   -> Store document data in MongoDB
   -> Store vectors in Qdrant
   -> Embed the user's question
   -> Retrieve relevant chunks
   -> Rerank candidate chunks when reranking is enabled
   -> Inspect retrieval behavior while debugging
   -> Send context + question to the LLM
   -> Return answer with sources
```

The main goal of this project is to understand every part of that flow instead of treating RAG like a magic black box.

---

## Project Structure

```txt
docudok/
  client/
    src/
      components/
      pages/
      services/
      hooks/
      store/
      types/
      App.tsx
      main.tsx

  server/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
      app.ts
      server.ts
```

---

## Local Setup

### 1. Clone The Repo

```bash
git clone https://github.com/yourname/docudok.git
cd docudok
```

### 2. Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 3. Add Environment Variables

Create `server/.env`:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/docudok
JWT_SECRET=your_jwt_secret
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=20

OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
CHAT_MODEL=gpt-4o-mini

CHUNK_SIZE=1000
CHUNK_OVERLAP=150
CHUNK_MIN_LENGTH=120

QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=document_chunks

RETRIEVAL_DEBUG=false
RETRIEVAL_MIN_SOURCES=3
RETRIEVAL_SOURCE_LIMIT=5
RETRIEVAL_CANDIDATE_LIMIT=12
RETRIEVAL_SCORE_CUTOFF=0.7

RERANKING_ENABLED=true
RERANKING_CANDIDATE_LIMIT=15
RERANKING_SOURCE_LIMIT=5
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 4. Start MongoDB And Qdrant

```bash
docker compose up -d
```

### 5. Run The Backend

```bash
cd server
npm run dev
```

### 6. Run The Frontend

```bash
cd client
npm run dev
```

Open:

```txt
http://localhost:5173
```

---

## API Routes

### Health

```txt
GET /api/health
```

### Auth

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

### Documents

```txt
POST   /api/v1/documents/upload
GET    /api/v1/documents
GET    /api/v1/documents/:id
POST   /api/v1/documents/:id/retry
POST   /api/v1/documents/:id/search
POST   /api/v1/documents/:id/ask
DELETE /api/v1/documents/:id
```

### Chats

```txt
POST /api/v1/chats
GET  /api/v1/chats/:documentId
GET  /api/v1/chats/:chatId/messages
POST /api/v1/chats/:chatId/messages
```

---

## Build

Backend:

```bash
cd server
npm run build
```

Frontend:

```bash
cd client
npm run build
```

The frontend uses route-level code splitting, so page bundles are loaded only when needed instead of shipping the whole UI in the first JavaScript chunk.

---

## Notes To Future Me

- Existing documents need to be retried or re-uploaded when cleaning or chunking logic changes.
- Source scores are vector similarity scores, not grades.
- Source cards show relative relevance beside the raw vector score. Low raw scores can still be the best match for a short or messy document.
- Set `CORS_ORIGIN` to your deployed frontend URL before shipping the API anywhere public.
- API errors may include a request ID, which helps match frontend errors with backend logs.
- Auth routes return rate-limit headers and can be tuned with `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX_REQUESTS`.
- Document titles are capped at 120 characters, and document questions are capped at 2,000 characters.
- Set `RETRIEVAL_DEBUG=true` when you want to inspect candidate and selected chunk scores in the server logs.
- Tune `RETRIEVAL_CANDIDATE_LIMIT` and `RETRIEVAL_SCORE_CUTOFF` when experimenting with retrieval quality.
- Reranking retrieves more Qdrant candidates first, then asks the LLM to choose the best sources before answering.
- Tune `RERANKING_CANDIDATE_LIMIT` and `RERANKING_SOURCE_LIMIT` when experimenting with reranked retrieval.
- Tune `CHUNK_SIZE`, `CHUNK_OVERLAP`, and `CHUNK_MIN_LENGTH` when changing how documents are split.
- Chunk cleanup removes common PDF artifacts and keeps code-like lines separate from prose so embeddings get cleaner context.
- Use the chunk inspector when retrieval feels weird. Bad answers often start with bad chunks, not bad models.
- Watch both word count and character count when tuning chunks. PDFs with weird spacing can make one metric lie.
- Better chunks usually matter more than bigger prompts.
- Retrieval quality depends heavily on extraction quality, cleaning, chunking, and embedding model choice.
- Keep OpenAI-compatible provider config in one place so switching providers does not turn into a refactor party.
- Shared frontend helpers handle small formatting and clipboard actions so page components stay easier to read.
- Do not pretend this is production-ready until deployment, security, logging, and file handling are cleaned up properly.

---

## Troubleshooting

- If a PDF fails processing, check whether it contains selectable text. Scanned/image-only PDFs need OCR, which this project does not handle yet.
- Failed documents show the stored processing error on the dashboard, then retry clears the old error before processing again.
- If the original uploaded file is missing during retry, the document keeps a clear `Uploaded file not found` error.
- If document chat returns weak answers, open the chunk inspector and test retrieval before blaming the model.
- If uploads work but chat does not, make sure Qdrant is running and `QDRANT_URL` points to the right instance.
- If embeddings fail, check `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and the embedding model/dimension settings.

---

## Current Status

Still building, still learning, still breaking things in useful ways.
