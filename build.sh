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
  echo "DATABASE_URL is set. Pushing schema to database (with fallback if needed)..."
  if npx drizzle-kit --help >/dev/null 2>&1; then
    if npx drizzle-kit --help | grep -qiE 'push|generate'; then
      if npx drizzle-kit push; then
        echo "Drizzle push succeeded"
      else
        echo "Drizzle push failed or not supported; attempting generate"
        npx drizzle-kit generate || true
      fi
    else
      echo "drizzle-kit CLI does not expose push or generate; skipping push"
    fi
  else
    echo "drizzle-kit CLI not found; installing dev dependencies..."
    npm install --include=dev
    if npx drizzle-kit push; then
      echo "Drizzle push succeeded"
    else
      echo "Drizzle push failed; attempting generate"
      npx drizzle-kit generate || true
    fi
  fi
  echo "Seeding demo data..."
  npx tsx scripts/seed-demo.ts
else
  echo "DATABASE_URL is not set. Skipping DB migrations and seed."
fi

echo "Building Vite app..."
npm run build:full
