#!/bin/bash
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL is set. Pushing schema to database..."
  npx drizzle-kit push --force
  echo "Seeding demo data..."
  npx tsx scripts/seed-demo.ts
else
  echo "DATABASE_URL is not set. Skipping DB migrations and seed."
fi

echo "Building Vite app..."
vite build
