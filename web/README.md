# AI Inspection Web UI

Next.js frontend for the AI Inspection application.

## Getting Started

### Prerequisites

- Node.js 20+
- API server running (see `../api/`)

### Development

```bash
# From repository root
npm install
npm run dev --workspace=web
```

Open [http://localhost:3001](http://localhost:3001) to view the app.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |

For local development, the default points to the API running on port 3000.

## Testing

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e --workspace=web

# Run with UI
npm run test:e2e:ui --workspace=web

# Run headed (visible browser)
npm run test:e2e:headed --workspace=web
```

## Deployment

### Vercel (Test Environment)

The web app deploys to Vercel at `ai-inspection-test.vercel.app`.

**Required Environment Variables:**

```
NEXT_PUBLIC_API_URL=https://ai-inspection-api-test.fly.dev
```

Set this in Vercel Dashboard → Project Settings → Environment Variables.

**Configuration:**

- `vercel.json` configures build settings and security headers
- Framework auto-detected as Next.js
- Region: Sydney (`syd1`) for proximity to API

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (from web/ directory)
cd web
vercel --prod
```

## Project Structure

```
web/
├── app/           # Next.js App Router pages
├── components/    # React components
├── lib/           # Utilities (API client, auth)
├── e2e/           # Playwright E2E tests
├── public/        # Static assets
└── vercel.json    # Vercel deployment config
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
