#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Add a PostgreSQL service and link it."
  exit 1
fi

echo "==> Running database migrations..."
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma 2>/dev/null || \
  npx prisma db push --schema=packages/db/prisma/schema.prisma --skip-generate

echo "==> Starting BSSH API..."
exec node apps/api/dist/main.js
