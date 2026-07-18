#!/bin/bash
set -e

echo "Running Prisma db push..."
# --accept-data-loss is required because this project uses `db push` (no migration
# files); Prisma otherwise refuses additive changes like new unique constraints.
# NOTE: before onboarding real client data, move to `prisma migrate` for safe,
# reviewable schema changes — db push can drop columns without prompting.
node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "Starting Next.js server..."
node server.js
