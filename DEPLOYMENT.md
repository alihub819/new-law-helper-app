# Law Helper App - Cloudflare Pages Deployment

## Architecture

This app uses a **separate frontend and backend** architecture:

- **Frontend**: React app hosted on Cloudflare Pages (static site)
- **Backend**: Express API hosted separately (Vercel, Render, Railway, etc.)

## Deployment Steps

### 1. Deploy the Backend API

First, deploy the Express API to a Node.js hosting service:

**Option A: Vercel (Recommended)**
```bash
# Use existing Vercel setup
# The api/ folder is already configured for Vercel serverless functions
```

**Option B: Render/Railway**
```bash
# Deploy the Express server
# Set environment variables:
# - OPENAI_API_KEY
# - SESSION_SECRET
# - DATABASE_URL (if using database)
```

### 2. Get Your API URL

After deploying the backend, note the URL:
```
https://your-api.vercel.app
# or
https://your-api.onrender.com
```

### 3. Deploy Frontend to Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. Click "Pages" → "Create a project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/public`
5. Add environment variable:
   - `VITE_API_URL` = `https://your-api.vercel.app` (your backend URL)
6. Click "Save and Deploy"

### 4. Environment Variables

**Frontend (Cloudflare Pages)**:
```
VITE_API_URL=https://your-backend-url.com
NODE_ENV=production
```

**Backend (Vercel/Render)**:
```
OPENAI_API_KEY=your-key-here
SESSION_SECRET=your-secret-here
DATABASE_URL=your-db-url (optional)
```

## Troubleshooting

### CORS Issues
If API calls fail with CORS errors, add this to your backend:
```javascript
app.use(cors({
  origin: 'https://your-frontend.pages.dev',
  credentials: true
}));
```

### API Not Found (404)
Make sure `VITE_API_URL` is set correctly in Cloudflare Pages environment variables.

### Build Failures
- Ensure `vite` is in devDependencies
- Check that build output goes to `dist/public`
- Verify all imports are valid

## Local Development

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend (with local API)
cd client && npm run dev

# Or use Vite directly
npx vite --config vite.config.ts
```

## Important Notes

1. **Cloudflare Pages = Static Only**: Cannot run Express/Node.js code
2. **API Required**: The AI features need the backend API to work
3. **Session Storage**: Currently using in-memory storage (resets on deploy)
4. **File Uploads**: Work with the API but files are processed in memory

## Migration from Vercel

If moving from Vercel (full-stack) to Cloudflare Pages:

1. Deploy backend separately
2. Update frontend API calls to use full URLs
3. Set `VITE_API_URL` environment variable
4. Deploy frontend to Cloudflare Pages
5. Update CORS settings on backend

## Support

For issues:
1. Check browser console for errors
2. Verify API is responding: `GET /api/health`
3. Check Cloudflare Pages deployment logs
4. Verify environment variables are set
