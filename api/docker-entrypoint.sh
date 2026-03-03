#!/bin/sh
set -e

echo "Waiting for postgres..."
until nc -z postgres 5432 2>/dev/null; do
  sleep 1
done
sleep 2

echo "Postgres ready. Running migrations..."
/workspace/node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

echo "Seeding test data..."
cd /workspace/test && DATABASE_URL="$DATABASE_URL" TEST_PASSWORD="${TEST_PASSWORD:-test123}" /workspace/node_modules/.bin/tsx scripts/seed-test-env.ts 2>/dev/null || true
cd /app

echo "Starting API..."
exec "$@"
