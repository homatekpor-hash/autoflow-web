# ShopLink Web

Next.js 14 frontend for the ShopLink workshop management platform.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
copy .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL to point to your running API (default: http://localhost:3001)

# 3. Start dev server
npm run dev
```

Open http://localhost:3000

**Make sure the API server (shoplink-api) is running first.**

---

## Pages

### Protected (login required)
| Route | Description |
|-------|-------------|
| `/dashboard` | Network overview — all workshops + KPIs |
| `/dashboard/workshops` | Workshop list (Owner only) |
| `/dashboard/workshops/:id` | Job board (Kanban) for one workshop |
| `/dashboard/reports` | Revenue, jobs, performance analytics |
| `/dashboard/team` | User management + invite |

### Public (no login)
| Route | Description |
|-------|-------------|
| `/checkin/:qrToken` | Customer QR check-in form |
| `/track/:trackingToken` | Customer job tracker (live updates) |
| `/estimate/:token` | Customer estimate approval |

---

## Architecture

```
app/                   ← Next.js App Router pages
components/            ← Shared UI (Sidebar, JobBoard, ui.tsx)
context/AuthContext.tsx ← JWT auth + React context
lib/api.ts             ← Typed fetch wrapper for every API endpoint
lib/types.ts           ← Shared TypeScript types
```

## Connecting to the backend

All API calls go through `lib/api.ts`. Set `NEXT_PUBLIC_API_URL` in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For production, point this at your deployed API URL (Railway, Render, etc.).

## Deployment (Vercel)

```bash
npm run build          # verify build succeeds locally first
vercel                 # deploy
```

Set `NEXT_PUBLIC_API_URL` in your Vercel project environment variables.
