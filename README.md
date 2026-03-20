# AI Chat Application

A modern chat application with AI responses, built with React (frontend) and Node.js + MongoDB (backend).

## ⚙️ Environment Setup

### Backend (.env)

Create `apps/backend/.env`:

```bash
PORT=5005
MONGODB_URI=mongodb://localhost:27017/ai-chat
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here
```

Get your Groq API key at: https://console.groq.com/

### Frontend (.env)

Create `apps/frontend/.env`:

```bash
REACT_APP_API_BASE_URL=http://localhost:5005
```

### Docker (.env)

For Docker, create `.env` at root:

```bash
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb://host.docker.internal:27017/ai-chat
```

## 🚀 Quick Start

### Option A: Bash Script (Easiest - No Docker)

```bash
# 1. Run the start script
bash start.sh

# 2. Stop all services
bash stop.sh

# Or press Ctrl+C
```

### Option B: Docker

```bash
# 1. Setup environment and install dependencies
make setup

# 2. Add your API key to apps/backend/.env
# GROQ_API_KEY=your_groq_api_key_here

# 3. Start with Docker
make start

# Or start in development mode
make dev
```

