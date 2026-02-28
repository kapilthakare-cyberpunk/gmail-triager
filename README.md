# gmail-triager

A single-user Gmail inbox triager (Next.js on Vercel) that:
- Classifies emails (rules → auto-skip allowlist → Groq → Mistral fallback)
- Applies Gmail labels under `triage/*`
- Marks emails read unless `triage/needs-attention`
- Provides a simple web UI to review and override categories

## Setup
1. Create Google OAuth client (Web application)
2. Enable Gmail API
3. Set Vercel environment variables (see `.env.example`)
4. Create Vercel Postgres and run `sql/schema.sql`
5. Deploy on Vercel
6. Sign in once as `kapilsthakare@gmail.com` to capture refresh token

## Cron
Cron runs every 2 hours via `vercel.json` and calls:
- `/api/cron/triage?secret=...`

Replace `__CRON_SECRET__` in `vercel.json` with your real secret.
