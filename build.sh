#!/bin/bash
set -e

# Fix for npm optional dependencies bug
# Remove package-lock.json and node_modules to ensure clean install
echo "Cleaning npm dependencies to fix optional dependencies bug..."
rm -rf node_modules package-lock.json

# Install dependencies fresh
echo "Installing dependencies..."
npm install

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
