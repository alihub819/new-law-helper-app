# Railway Deployment - Quick Start Guide

Since the CLI needs browser interaction, here's the manual steps to deploy:

## Step 1: Go to Railway Dashboard
1. Open https://railway.app
2. Log in with GitHub

## Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repo: `Pablodd1/new-law-helper-app`

## Step 3: Add PostgreSQL
1. In your project dashboard, click "New +"
2. Select "Database" → "PostgreSQL"
3. Wait for it to provision

## Step 4: Add Environment Variables
In Railway dashboard → project → Variables tab, add:
- `SESSION_SECRET` = (generate a random string at https://randomkeygen.com)
- `OPENAI_API_KEY` = (your OpenAI key)
- `NODE_ENV` = `production`

## Step 5: Deploy
1. Click "Deploy" on the main branch
2. Wait for build to complete

## Step 6: Initialize Database
1. After deploy, click "New" → "Database" → "PostgreSQL" (if not already added)
2. Go to the deployed service → "Variables"
3. Click the terminal icon (one-time shell)
4. Run:
```bash
npx drizzle-kit push
npm run db:seed
```

## Step 7: Get Your URL
1. Click on the service → "Settings"
2. Copy the domain URL

---

**Important:** Make sure your DATABASE_URL is being used. Railway auto-generates this when you add PostgreSQL.

Once deployed, test at your Railway URL!
