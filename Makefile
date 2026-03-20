.PHONY: help install dev build start stop clean logs

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies for all apps
	@echo "Installing frontend dependencies..."
	cd apps/frontend && npm install
	@echo "Installing backend dependencies..."
	cd apps/backend && npm install
	@echo "✅ All dependencies installed"

dev-frontend: ## Start frontend in development mode
	cd apps/frontend && npm start

dev-backend: ## Start backend in development mode
	cd apps/backend && npm run dev

dev: ## Start both frontend and backend in development mode
	@echo "Starting development servers..."
	@make -j2 dev-frontend dev-backend

run: ## Run application without Docker (uses bash script)
	./start.sh

stop-local: ## Stop local application (non-Docker)
	./stop.sh

build: ## Build Docker images
	docker-compose build

start: ## Start all services with Docker Compose (uses local MongoDB if running)
	docker-compose up -d
	@echo "✅ Services started"
	@echo "Frontend: http://localhost:3001"
	@echo "Backend: http://localhost:5005"
	@echo "MongoDB: Using local instance on localhost:27017"

start-with-db: ## Start all services including MongoDB container
	docker-compose --profile with-db up -d
	@echo "✅ Services started with MongoDB container"
	@echo "Frontend: http://localhost:3001"
	@echo "Backend: http://localhost:5005"
	@echo "MongoDB: localhost:27017 (Docker container)"

stop: ## Stop all services
	docker-compose down
	@echo "✅ Services stopped"

restart: stop start ## Restart all services

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

clean: ## Remove all containers, volumes, and node_modules
	docker-compose down -v
	rm -rf apps/frontend/node_modules
	rm -rf apps/backend/node_modules
	rm -rf apps/frontend/build
	rm -rf apps/backend/uploads/*
	@echo "✅ Cleaned up"

test-backend: ## Run backend tests
	cd apps/backend && npm test

test-frontend: ## Run frontend tests
	cd apps/frontend && npm test

setup: ## Initial setup - copy env files and install dependencies
	@echo "Setting up environment files..."
	@if [ ! -f .env ]; then \
		cp .env.example .env && echo "✓ Created .env (for Docker)"; \
	else \
		echo "✓ .env already exists"; \
	fi
	@if [ ! -f apps/backend/.env ]; then \
		cp apps/backend/.env.example apps/backend/.env && echo "✓ Created apps/backend/.env (for local dev)"; \
	else \
		echo "✓ apps/backend/.env already exists"; \
	fi
	@if [ ! -f apps/frontend/.env ]; then \
		cp apps/frontend/.env.example apps/frontend/.env && echo "✓ Created apps/frontend/.env"; \
	else \
		echo "✓ apps/frontend/.env already exists"; \
	fi
	@echo ""
	@echo "Installing dependencies..."
	@make install
	@echo ""
	@echo "✅ Setup complete"
	@echo ""
	@echo "⚠️  Next steps:"
	@echo "   1. Add your GROQ_API_KEY to .env (for Docker)"
	@echo "   2. Add your GROQ_API_KEY to apps/backend/.env (for local)"
	@echo "   3. Run: make start (Docker) or ./start.sh (local)"
	@echo ""
