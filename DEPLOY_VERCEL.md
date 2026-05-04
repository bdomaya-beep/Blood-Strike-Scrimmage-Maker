# Deploy to Vercel

This project is configured for Vercel using `vercel.json`.

## 1. Import the repository

1. Open Vercel dashboard.
2. Click **Add New > Project**.
3. Import this repository.
4. Keep **Root Directory** as repository root.

Vercel will use:
- Install Command: `npm install --workspaces --include-workspace-root`
- Build Command: `npm run build:vercel`
- Output Directory: `artifacts/blood-strike-hub/dist/public`

## 2. Set required environment variables

In Project Settings > Environment Variables, add:

- `DATABASE_URL`: Postgres connection string for production DB
- `SESSION_SECRET`: long random secret string
- `NODE_ENV`: `production`

Optional:
- `LOG_LEVEL`: defaults to `info`
- `VITE_API_BASE_URL`: leave empty for same-origin API routing

## 3. Deploy

Trigger a deploy from Vercel UI.

## 4. Verify after deploy

- Open `/api/healthz` and verify JSON `{ "status": "ok" }`
- Open app routes directly (for example `/scrims`, `/teams`, `/leaderboard`) and verify no 404 from static hosting

## Notes

- The frontend is a SPA and Vercel rewrites all non-API routes to `index.html`.
- API routes are served from `api/*.ts` using Vercel Serverless Functions.
- If DB tables are missing, API endpoints may return schema initialization errors. Run your schema migrations/push against the production database first.
