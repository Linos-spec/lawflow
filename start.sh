#!/bin/bash
set -e

echo "Running Prisma db push..."
npx prisma db push --skip-generate

echo "Starting Next.js server..."
node server.js
