#!/bin/bash
set -e

# On Vercel, node_modules are already installed by the platform.
# Only reinstall locally if node_modules is missing.
if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Installing dependencies..."
  npm install
else
  echo "node_modules found. Skipping install."
fi

if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL is set. Pushing schema to database..."
  npx drizzle-kit push --force
  echo "Seeding demo data..."
  npx tsx scripts/seed-demo.ts
else
  echo "DATABASE_URL is not set. Skipping DB migrations and seed."
fi

echo "Building Vite app..."
npm run build:full
