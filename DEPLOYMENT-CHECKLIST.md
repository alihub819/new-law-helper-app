# Deployment Checklist

- [ ] Run `./scripts/pre-deploy-check.sh` locally.
- [ ] Create `.env` file locally (for testing).
- [ ] Set up Environment Variables in Vercel (see `vercel-env-setup.md`).
- [ ] Commit all changes to GitHub.
- [ ] Deploy via Vercel Dashboard (see `VERCEL-SETUP-GUIDE.md`).
- [ ] Post-Deployment Verification:
    - [ ] `https://your-app.vercel.app/api/health` -> `{"status":"ok"}`
    - [ ] Login page loads correctly.
    - [ ] Demo login works (`/api/demo-login`).
    - [ ] Test key features (e.g., search, document generation).
