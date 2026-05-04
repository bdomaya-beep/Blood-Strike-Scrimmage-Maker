#!/bin/sh
set -e

echo "==> Running database migrations..."
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma || \
  npx prisma db push --schema=packages/db/prisma/schema.prisma --skip-generate

echo "==> Starting BSSH API..."
exec node apps/api/dist/main.js
