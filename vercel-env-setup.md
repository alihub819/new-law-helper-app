# Vercel Environment Variable Setup

To deploy your application successfully on Vercel, you must configure the following environment variables in your Vercel project settings.

Go to: **Settings** > **Environment Variables**

## Required Variables

| Variable Name | Description | Example Value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `SESSION_SECRET` | Secret key for signing session cookies | (Generate a random 32+ char string) |
| `OPENAI_API_KEY` | API Key for OpenAI features | `sk-...` |
| `NODE_ENV` | Environment mode | `production` (Vercel sets this automatically, but good to double check) |
| `APP_URL` | The URL of your deployed app | `https://your-project.vercel.app` (Add after first deployment) |

## Optional Variables (Feature Specific)

| Variable Name | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | For image/file uploads |
| `CLOUDINARY_API_KEY` | For image/file uploads |
| `CLOUDINARY_API_SECRET` | For image/file uploads |
| `REPL_ID` | Only needed if running on Replit |

## Notes
- **Do not commit your `.env` file to GitHub.**
- If you don't have a database yet, you can create a Postgres database on Vercel Storage or Neon.tech.
