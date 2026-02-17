# Cloudflare Pages Deployment Guide

This project has been configured for deployment to Cloudflare Pages.

## Quick Deploy

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the frontend:**
   ```bash
   npm run build:cloudflare
   ```

3. **Deploy to Cloudflare:**
   ```bash
   npx wrangler pages deploy dist/public
   ```

## Alternative: Deploy via GitHub Integration

1. Go to https://dash.cloudflare.com
2. Create a new Pages project
3. Connect to your GitHub repository
4. Set:
   - Production branch: `main`
   - Build command: `npm run build:cloudflare`
   - Output directory: `dist/public`

## Environment Variables

Set these in Cloudflare Pages dashboard:
- `OPENAI_API_KEY` - Your OpenAI API key

## API Notes

The current setup serves the **frontend** on Cloudflare Pages. For the **API**:

### Option 1: External API (Recommended for this app)
- Keep your existing Vercel/Railway/Render API
- Update frontend to point to your API URL in `client/src/lib/api.ts`

### Option 2: Cloudflare Workers (Advanced)
- Deploy Express app as a separate Worker
- Requires adapting the Express routes to Workers syntax
- Use `@cloudflare/workers-express` or similar adapter

### Option 3: Durable Objects (Advanced)
- Full stateful backend on Cloudflare
- More complex setup

## Troubleshooting

### CORS Issues
Add to `_headers` file:
```
/api/*
  Access-Control-Allow-Origin: *
```

### Build Errors
Make sure you're using Node.js 20+:
```bash
node --version
```

## Comparison: Vercel vs Cloudflare

| Feature | Vercel | Cloudflare |
|---------|--------|------------|
| Free tier | 100GB bandwidth | Unlimited bandwidth |
| Edge functions | Yes | Yes |
| Database | Vercel Postgres | D1 (SQLite) |
| Storage | Vercel Blob | R2 (S3-compatible) |
| SSL | Automatic | Automatic |
| Custom domains | Free | Free |
