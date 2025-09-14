# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

PaperOrbit is a local application for searching, viewing, and saving LLM/AI Agent-related papers from OpenAlex/arXiv with Japanese 3-paragraph summaries. Built as a pnpm workspace monorepo with TypeScript, React, Express, and Prisma/SQLite.

## Architecture

### Workspace Structure
- **apps/web**: Vite + React frontend with Cytoscape.js for citation graph visualization (port 5173)
- **apps/server**: Express REST API with zod validation (port 5175)
- **packages/agent**: Search/summarization/embedding tools for OpenAlex, arXiv, and OpenAI integration
- **packages/db**: Prisma schema and SQLite client
- **packages/shared**: Common types and zod schemas shared across packages

### Data Flow
1. Frontend (React) → API requests to Express server
2. Server uses agent package to search OpenAlex/arXiv APIs
3. Papers saved to SQLite via Prisma with embeddings and summaries
4. PDF downloads → pdf-parse for text extraction
5. Text embeddings via OpenAI text-embedding-3-small for local search

### Key Technologies
- **Database**: SQLite with Prisma ORM
- **API Validation**: zod schemas in shared package
- **Frontend Build**: Vite
- **Backend Dev**: tsx watch mode
- **Package Manager**: pnpm workspaces
- **AI Integration**: OpenAI API for summaries and embeddings

## Development Commands

### Initial Setup
```bash
# Install dependencies
pnpm i

# Setup environment variables
cp .env.example .env
# Set OPENAI_API_KEY in .env

# Initialize database
pnpm -F @paperorbit/db prisma migrate dev
```

### Development
```bash
# Start both frontend and backend
pnpm dev

# Or start individually:
pnpm -F @paperorbit/server dev  # API server on :5175
pnpm -F @paperorbit/web dev      # Web app on :5173
```

### Building
```bash
# Build all packages
pnpm build

# Build specific package
pnpm -F @paperorbit/web build
pnpm -F @paperorbit/server build
```

### Linting
```bash
# Lint all packages
pnpm lint

# Lint specific package
pnpm -F @paperorbit/web lint
```

### Database Operations
```bash
# Generate Prisma client
pnpm -F @paperorbit/db generate

# Create migration
pnpm -F @paperorbit/db prisma migrate dev

# View database
pnpm -F @paperorbit/db prisma studio
```

## Environment Variables

Required in `.env`:
- `OPENAI_API_KEY`: OpenAI API key for summaries and embeddings
- `OPENAI_BASE_URL`: (Optional) Custom OpenAI endpoint
- `PORT`: Server port (default: 5175)
- `NODE_ENV`: development/production

## Database Schema

Main entities in SQLite:
- **Paper**: Core paper data with DOI, arXiv ID, OpenAlex ID
- **Embedding**: Vector embeddings for semantic search
- **Snapshot**: Search result snapshots
- **PdfArtifact**: Extracted PDF text
- **Note**: User notes on papers

## API Endpoints

Server exposes REST API at `http://localhost:5175/api/`:
- `POST /search`: Search OpenAlex/arXiv
- `POST /papers`: Save paper to database
- `GET /papers`: List saved papers
- `POST /papers/:id/summarize`: Generate Japanese summary
- `POST /papers/:id/download-pdf`: Download and extract PDF
- `POST /search/local`: Vector similarity search