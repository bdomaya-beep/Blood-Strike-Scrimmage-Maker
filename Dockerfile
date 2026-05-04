# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy manifests for all workspaces so npm can resolve them
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/contracts/package.json ./packages/contracts/

# Install all workspace dependencies (including devDeps needed for build)
RUN npm ci --include=dev

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

# Generate Prisma client from the monorepo schema location
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma

# Build the NestJS API
RUN npm -w @bssh/api run build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy root node_modules (hoisted deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled API output
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy Prisma schema + generated client for runtime
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Startup script
COPY --from=builder /app/scripts/docker-start.sh ./scripts/docker-start.sh
RUN chmod +x ./scripts/docker-start.sh

EXPOSE 3001

CMD ["sh", "./scripts/docker-start.sh"]
