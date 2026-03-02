# Render Deployment Guide

## Why Render?

- **Free tier** available (750 hours/month)
- Persistent servers - no cold starts
- Easy PostgreSQL integration
- Simple dashboard

---

## Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub
3. Authorize access to your repos

## Step 2: Create New Web Service

1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repo: `Pablodd1/new-law-helper-app`
3. Configure:
   - **Name**: `law-helper`
   - **Branch**: `main`
   - **Build Command**: `npm run build:full`
   - **Start Command**: `npm run start`

## Step 3: Add PostgreSQL

1. Click **"New"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `law-helper-db`
   - **Database**: `lawhelper`
   - **User**: `lawhelper`
3. Click **Create Database**

## Step 4: Connect Database

1. Go to your web service **"Environment"** tab
2. Under **"Connections"**, find your PostgreSQL
3. Click **"Connect"** - this adds DATABASE_URL automatically

## Step 5: Add Environment Variables

Add these in the **"Environment"** tab:
| Variable | Value |
|---------|-------|
| SESSION_SECRET | Generate at https://randomkeygen.com |
| OPENAI_API_KEY | Your OpenAI key |
| NODE_ENV | `production` |

## Step 6: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~5-10 minutes)

## Step 7: Initialize Database

1. After deploy, go to your web service
2. Click **"Shell"** icon
3. Run:
```bash
npx drizzle-kit push
npm run db:seed
```

## Step 8: Get Your URL

Your app will be available at: `https://law-helper.onrender.com`

---

## Troubleshooting

### 502 Bad Gateway
- Check logs in Render dashboard
- Make sure DATABASE_URL is set correctly

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL format

### Build Failed
- Make sure all dependencies are in package.json
- Check build logs for errors
