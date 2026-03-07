#!/bin/bash
set -e

# On Vercel or Render, node_modules are already installed by the platform.
# But we need devDependencies like drizzle-kit and vite to build and run migrations.
if [ ! -d "node_modules/drizzle-kit" ]; then
  echo "drizzle-kit not found. Installing all dependencies including dev..."
  npm install --include=dev
else
  echo "node_modules/drizzle-kit found. Skipping install."
fi

if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL is set. Pushing schema to database..."
  npx drizzle-kit push
  echo "Seeding demo data..."
  npx tsx scripts/seed-demo.ts
else
  echo "DATABASE_URL is not set. Skipping DB migrations and seed."
fi

echo "Building Vite app..."
npm run build:full
