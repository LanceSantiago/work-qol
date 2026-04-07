# work-qol dev commands
# Install just: https://github.com/casey/just

set windows-shell := ["cmd", "/c"]

# List available commands
default:
    just --list

# ── Docker ────────────────────────────────────────────────────────────────────

# Rebuild images and start all containers (app + partykit)
start:
    docker compose up --build -d

# Start containers in the background
start-bg:
    docker compose up --build -d

# Stop all containers
stop:
    docker compose down

# View live logs from all containers
logs:
    docker compose logs -f

# Restart containers without rebuilding
restart:
    docker compose restart

# Rebuild images only (no start)
build:
    docker compose build

# Remove containers, networks, and volumes
clean:
    docker compose down -v --remove-orphans

# ── Local Node (no Docker) ────────────────────────────────────────────────────

# Install dependencies
install:
    npm install

# Run Vite dev server only
dev:
    npm run dev

# Run PartyKit dev server only
party:
    npm run party:dev

# Build + run wrangler pages dev (tests CF Pages Functions locally)
pages:
    npm run pages:dev

# ── Code quality ──────────────────────────────────────────────────────────────

# Type check
check:
    npm run typecheck

# Run ESLint
lint:
    npm run lint

# Auto-fix lint + format
fmt:
    npm run lint -- --fix && npm run format

# Run tests (single pass)
test:
    npm run test

# Run tests in watch mode
test-watch:
    npm run test:watch

# Run tests with coverage report
coverage:
    npm run coverage

# Run all checks (typecheck + lint + test + build)
ci:
    npm run typecheck && npm run lint && npm run test && npm run build

# ── Deployment ────────────────────────────────────────────────────────────────

# Deploy PartyKit server
deploy-party:
    npm run party:deploy

# Production build
prod-build:
    npm run build
