# Vercel Deployment Setup Guide

Follow these steps to deploy your application to Vercel.

## 1. Prerequisites
- A Vercel account.
- A GitHub repository for your project.
- A PostgreSQL database (e.g., Neon, Vercel Storage, Supabase).

## 2. Project Setup
1.  **Clone** this repository to your local machine.
2.  **Verify** the contents of `.env.example`.
3.  **Run** `./scripts/pre-deploy-check.sh` to ensure everything is ready locally.

## 3. GitHub
1.  **Commit** all changes and push to GitHub.
    ```bash
    git add .
    git commit -m "chore: prepared for vercel deployment"
    git push origin main
    ```

## 4. Vercel Dashboard
1.  **Import Project:** Go to https://vercel.com/new and import your GitHub repository.
2.  **Configure Project:**
    - **Framework Preset:** Vercel should auto-detect "Vite" or "Other". If not, select "Other".
    - **Root Directory:** `./` (default)
    - **Build Command:** `npm run build` (should be auto-detected from `package.json`)
    - **Output Directory:** `dist` (default for Vite)
    - **Install Command:** `npm install` (default)
3.  **Environment Variables:**
    - Add the variables listed in `vercel-env-setup.md`.
    - **Crucial:** Ensure `DATABASE_URL` is set correctly.
    - **Crucial:** Ensure `SESSION_SECRET` is set.

## 5. Deploy
1.  Click **Deploy**.
2.  Wait for the build to complete.
3.  If build fails, check logs.

## 6. Post-Deployment Verification
1.  Go to your deployed URL (e.g., `https://your-project.vercel.app`).
2.  Check `/api/health` to verify the backend is running.
3.  Try logging in with the demo account to verify database connection.
