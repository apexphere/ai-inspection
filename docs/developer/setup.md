# Developer Setup Guide

> Get the AI Inspection development environment running locally.

**Status:** Current  
**Author:** Sage  
**Date:** 2026-02-23  
**Related:** #398

---

## Prerequisites

### Required Software

| Software | Version | Check | Install |
|----------|---------|-------|---------|
| **Node.js** | 20+ | `node -v` | [nodejs.org](https://nodejs.org) |
| **npm** | 10+ | `npm -v` | Comes with Node.js |
| **Docker** | 24+ | `docker -v` | [docker.com](https://docker.com) |
| **Git** | 2.40+ | `git -v` | [git-scm.com](https://git-scm.com) |

### Optional Tools

| Tool | Purpose | Install |
|------|---------|---------|
| **Railway CLI** | Deploy to Railway | `npm i -g @railway/cli` |
| **Vercel CLI** | Deploy to Vercel | `npm i -g vercel` |
| **OpenClaw** | Run the inspector agent | `npm i -g openclaw` |

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/apexphere/ai-inspection.git
cd ai-inspection
```

### 2. Install Dependencies

```bash
# Root dependencies
npm install

# API dependencies
cd api && npm install && cd ..

# Web dependencies
cd web && npm install && cd ..

# MCP server dependencies
cd server && npm install && cd ..
```

### 3. Start Services

```bash
# Start API + Database
docker-compose up -d api db

# Wait for healthy
docker-compose ps

# Run database migrations
docker-compose exec api npx prisma migrate deploy

# Seed test data
docker-compose exec api npx prisma db seed
```

### 4. Start Web UI

```bash
cd web
npm run dev
```

### 5. Verify

- **API:** http://localhost:3000/health
- **Web:** http://localhost:3001

---

## Project Structure

```
ai-inspection/
├── api/                  # Express backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   └── middleware/   # Auth, validation
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   ├── migrations/   # Migration files
│   │   └── seed.ts       # Test data
│   └── package.json
│
├── web/                  # Next.js frontend
│   ├── app/              # Pages and routes
│   ├── components/       # React components
│   └── package.json
│
├── server/               # MCP server (inspection tools)
│   ├── src/
│   │   ├── tools/        # MCP tool implementations
│   │   └── services/     # PDF generation, etc.
│   └── package.json
│
├── skill/                # OpenClaw skill definition
│   ├── SKILL.md          # Conversation guidance
│   └── mcp.json          # MCP server config
│
├── config/               # Configuration files
│   ├── checklists/       # Inspection templates
│   └── comments/         # Boilerplate library
│
├── templates/            # Report templates
│   └── reports/          # Handlebars PDF templates
│
├── docs/                 # Documentation
├── test/                 # E2E tests
└── docker-compose.yml    # Local services
```

---

## Running Services

### API Only

```bash
docker-compose up api db
```

- API available at http://localhost:3000
- Health check: http://localhost:3000/health

### Full Stack

```bash
# Terminal 1: Backend
docker-compose up api db

# Terminal 2: Frontend
cd web && npm run dev
```

### MCP Server (for Agent)

```bash
cd server
npm run build
npm run dev    # Watch mode
```

---

## Database

### Accessing the Database

```bash
# Connect via Docker
docker-compose exec db psql -U inspection -d inspection

# Or use Prisma Studio (GUI)
cd api && npx prisma studio
```

### Running Migrations

```bash
# Apply migrations
docker-compose exec api npx prisma migrate deploy

# Create new migration
cd api && npx prisma migrate dev --name your_migration_name
```

### Resetting Database

```bash
# Reset and re-seed
docker-compose exec api npx prisma migrate reset
```

---

## Environment Variables

### API (api/.env)

```env
DATABASE_URL="postgresql://inspection:inspection@localhost:5432/inspection"
NODE_ENV="development"
JWT_SECRET="dev-secret-change-in-production"
APP_DOMAIN="localhost"
SERVICE_API_KEY="dev-api-key"
```

### Web (web/.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### MCP Server

Set in environment or `.env`:
```env
API_URL="http://localhost:3000"
SERVICE_API_KEY="dev-api-key"
```

---

## Running Tests

### API Tests

```bash
cd api
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### MCP Server Tests

```bash
cd server
npm test
```

### E2E Tests

Requires services running:

```bash
# Start services first
docker-compose up -d api db
cd web && npm run dev &

# Run E2E tests
cd test
npm test
```

---

## Common Tasks

### Adding an API Endpoint

1. Create route in `api/src/routes/`
2. Add business logic in `api/src/services/`
3. Register route in `api/src/index.ts`
4. Add tests

### Adding a Web Page

1. Create page in `web/app/`
2. Add components in `web/components/`
3. Use existing design system components

### Modifying Database Schema

1. Edit `api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Update seed data if needed

### Adding MCP Tool

1. Create tool in `server/src/tools/`
2. Register in tool list
3. Add tests
4. Update SKILL.md with usage guidance

---

## Troubleshooting

### Docker Issues

| Problem | Solution |
|---------|----------|
| Port already in use | `docker-compose down` then retry |
| Container won't start | Check logs: `docker-compose logs api` |
| Database connection refused | Wait for db to be ready, check `docker-compose ps` |

### Database Issues

| Problem | Solution |
|---------|----------|
| Migration fails | Check `DATABASE_URL`, ensure db is running |
| Seed fails | Run `prisma migrate reset` to start fresh |
| Schema out of sync | Run `prisma db push` for quick sync |

### Build Issues

| Problem | Solution |
|---------|----------|
| Module not found | Delete `node_modules`, run `npm install` |
| TypeScript errors | Check `tsconfig.json`, run `npm run build` |
| Prisma client outdated | Run `npx prisma generate` |

---

## Code Style

### TypeScript
- Strict mode enabled
- No `any` types
- Explicit return types on functions

### Commits
Follow conventional commits:
```
feat(api): add user endpoint
fix(web): resolve login bug
docs(readme): update setup steps
```

### PRs
- Branch from `develop`
- PR title: `[Name] type(scope): description`
- Link to related issue

---

## See Also

- [Deployment Runbook](../ops/deployment.md) — Production deployment
- [Architecture Overview](architecture.md) — System design *(coming soon)*
- [API Reference](api/README.md) — Endpoint documentation *(coming soon)*
