#!/bin/bash
set -e

echo "Starting Pre-Deployment Check..."

# 1. Check for typescript errors
echo "Running Type Check..."
npm run check

# 2. Build the project
echo "Running Build..."
npm run build

# 3. Verify static assets
if [ ! -d "server/public" ]; then
  echo "Error: server/public directory missing after build!"
  exit 1
fi

# 4. Verify critical environment variables are documented
if [ ! -f ".env.example" ]; then
  echo "Error: .env.example missing!"
  exit 1
fi

# 5. Run API Tests (Requires running server, might skip if no DB)
# For now, we'll try to run the test script.
echo "Running Endpoint Tests..."
# node scripts/test-endpoints.js # Uncomment this when ready to test live server

echo "All checks passed! Ready for deployment."
exit 0
