# Railway Deployment Guide

## Why Railway?

Railway is better for your app because:
- **Persistent servers** - No cold starts, sessions work reliably
- **Full PostgreSQL** - No serverless database limitations
- **Simpler debugging** - You get real server logs
- **No function limits** - Your AI features won't hit size limits

## Step-by-Step Deployment

### 1. Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Install Railway CLI: `npm i -g @railway/cli`

### 2. Provision PostgreSQL
```bash
railway init
railway add postgres
```

### 3. Deploy the App
```bash
# Login to Railway
railway login

# Link your project
railway link

# Deploy
railway up
```

### 4. Set Environment Variables
In Railway dashboard, add these variables:
- `DATABASE_URL` - (auto-generated from PostgreSQL)
- `SESSION_SECRET` - Generate a random string
- `OPENAI_API_KEY` - Your OpenAI key
- `NODE_ENV` = `production`

### 5. Initialize Database
```bash
railway run npx drizzle-kit push
railway run npm run db:seed
```

## Getting Your Railway URL

After deployment, get your URL:
```bash
railway domain
```

## Troubleshooting

### Session Issues
If sessions don't work, make sure:
1. `SESSION_SECRET` is set
2. Cookies are set correctly in Railway dashboard

### Database Connection
If you see "DATABASE_URL must be set":
1. Make sure PostgreSQL plugin is added to your project
2. Check DATABASE_URL in Railway variables

### Build Errors
If build fails on Railway:
1. Check that all dependencies are in package.json
2. Make sure build:full script runs successfully locally first
