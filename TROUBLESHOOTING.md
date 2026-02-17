# Troubleshooting Guide

Common issues encountered during Vercel deployment of `rest-express` project.

## 1. Build Failure: `vite not found`
**Cause:** Vite is a dev dependency. If `npm install` runs with `NODE_ENV=production` by default, `vite` won't be installed.
**Fix:**
- Ensure `vite` is in `dependencies` (not `devDependencies`) OR
- Set `NODE_ENV=development` in Vercel build settings (under Environment Variables, but this is usually overridden).
- **Better:** Ensure your build script installs dependencies correctly. Vercel usually handles this fine for build time.
- If it fails, try moving `vite` to `dependencies`.

## 2. Server Error: `MODULE_NOT_FOUND`
**Cause:** Missing dependencies or incorrect file paths.
**Fix:**
- Check logs for the specific module.
- Ensure `server/index.ts` (or `dist/server.js`) can find `server/vite.ts` and `server/public`.
- Verify `scripts/copy-public.js` ran successfully during build.

## 3. Database Connection Error
**Cause:** `DATABASE_URL` is missing or incorrect.
**Fix:**
- Check Vercel Environment Variables.
- Ensure the database allows connections from Vercel (check IP allowlist or allow 0.0.0.0/0).
- If using Neon/Supabase, verify connection string format (e.g., `postgresql://...`).

## 4. API Returns 404
**Cause:** Incorrect routing or missing rewrite rules.
**Fix:**
- Check `vercel.json`. It should rewrite `/api/(.*)` to `api/index.ts`.
- Ensure `api/index.ts` is correctly importing the app.

## 5. Deployment Size Too Large
**Cause:** Including unnecessary files in the serverless function.
**Fix:**
- Check `vercel.json` `includeFiles`. Currently set to `"server/**"`.
- Ensure large files (like big PDFs) are not in `server/public` if not needed.
- Exclude `node_modules` (Vercel handles deps automatically).
