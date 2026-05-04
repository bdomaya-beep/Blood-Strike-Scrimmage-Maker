# Blood Strike Scrim Hub

## Overview

Full-stack competitive esports management platform for Blood Strike battle royale scrimmages. Features user/team/scrim management, match scoreboards, global leaderboards, violations tracking, announcements, and admin panel with dark/neon tactical aesthetic.

## Stack

- **Monorepo tool**: npm workspaces
- **Node.js version**: 24
- **Package manager**: npm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS v4 (dark crimson/neon theme)
- **Routing**: Wouter
- **Data fetching**: TanStack Query (React Query v5)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Cookie-based sessions with SHA-256 + salt password hashing
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/api-server` — Express API server (port via `$PORT`, currently 8080)
- `artifacts/blood-strike-hub` — React/Vite frontend (dark esports UI)

## Key Commands

- `npm run typecheck` — full typecheck across all packages
- `npm run build` — typecheck + build all packages
- `npm -w @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `npm -w @workspace/db run push` — push DB schema changes (dev only)
- `npm -w @workspace/api-server run dev` — run API server locally

## Architecture

- `lib/api-spec/openapi.yaml` — Full API contract (users, teams, scrims, matches, violations, announcements, leaderboard, dashboard)
- `lib/db/src/schema/` — All Drizzle DB schemas
- `lib/api-client-react/src/generated/` — Auto-generated React Query hooks
- `artifacts/api-server/src/routes/` — All Express route handlers
- `artifacts/blood-strike-hub/src/pages/` — All frontend pages

## Auth Design

- Cookie-based session auth using `SESSION_SECRET` env var
- Passwords: SHA-256 + random 16-byte salt stored as `hash:salt`
- Session cookie: `session` (signed) containing `{ userId, username, role }`
- Roles: `admin`, `captain`, `player`

## React Query Config

- `retry: false` — no retries on failure (important: avoids loading freeze on 401)
- `refetchOnWindowFocus: false` — prevents refetch storm in Replit preview iframe
- `staleTime: 30_000` — 30s cache

## Seed Data

Pre-seeded accounts (password: `password` for all):
- `AdminHQ` (admin)
- `PhantomCaptain` (captain, leads Phantom Squad)
- `ShadowStrike` (captain, leads Shadow Force)
- `GhostRifle`, `IronViper`, `BloodHound` (players)

See the workspace `package.json` for workspace structure and commands.
