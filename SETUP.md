# Setup Guide for Meera's MF Tracker

This guide walks through every account, key, and click you need. No technical knowledge required.

---

## What you'll create accounts for

1. **GitHub** — stores the code (free)
2. **Supabase** — stores the database (free)
3. **Vercel** — hosts the website and runs the cron jobs (free)
4. **Google AI Studio** — powers the AI report writing (free)
5. **Resend** — sends the Saturday email (free up to 3000 emails/month)

---

## Step 1 — Set up Supabase (the database)

1. Go to [supabase.com](https://supabase.com) and sign up with Google.
2. Click **New project** → give it a name like "meera-mf-tracker" → choose a region close to India → click **Create project**.
3. Wait 1 minute for the project to start.
4. In the left sidebar, click **SQL Editor**.
5. Click **New query**.
6. Copy everything in the file `supabase/schema.sql` from this project and paste it into the SQL editor.
7. Click **Run** (green button). You'll see "Success" at the bottom.
8. Go to **Project Settings → API** (left sidebar).
9. Copy two things:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **service_role** key (under "Project API keys") — click the eye icon to reveal it
10. Keep these handy for Step 3.

---

## Step 2 — Get your API keys

### Gemini (AI writing)
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google.
3. Click **Create API key** → **Create API key in new project**.
4. Copy the key — it starts with `AIza...`

### Resend (email delivery)
1. Go to [resend.com](https://resend.com) and sign up.
2. After verifying your email, click **API Keys** in the sidebar.
3. Click **Create API Key** → name it "mf-tracker" → click **Add**.
4. Copy the key — it starts with `re_...`
5. **Important**: Resend lets you send from `onboarding@resend.dev` for testing. For real use, go to **Domains** → **Add Domain** and follow the instructions.

---

## Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New → Project**.
3. Select this GitHub repository.
4. Click **Deploy** (accept all defaults).
5. Once deployed, click **Settings → Environment Variables**.
6. Add each of these one by one:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GEMINI_MODEL` | `gemini-1.5-flash` |
| `RESEND_API_KEY` | Your Resend API key |
| `REPORT_FROM_EMAIL` | `onboarding@resend.dev` (for testing) |
| `REPORT_TO_EMAIL` | Your email address |
| `REPORT_CC_EMAIL` | Your CA's email (optional) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |
| `ADMIN_PASSPHRASE` | Any secret word |

7. After adding all variables, go to **Deployments** and click **Redeploy** on the latest deployment.

---

## Step 4 — First data load

1. Visit `https://your-project.vercel.app/api/cron/daily` in your browser.
   - You should see JSON like `{"status":"success","navUpdated":1234,...}`
   - This fetches all NAV data for the first time (takes ~30 seconds).
2. Visit `https://your-project.vercel.app/api/performance` to verify data is showing.

---

## Step 5 — Get your first report

To get the Saturday report now (without waiting):
- Visit `https://your-project.vercel.app/api/send-report` with a POST request.
- Or wait for Saturday at 8:00 AM IST — it runs automatically.

---

## What runs automatically

| When | What |
|------|------|
| Every day at 1:00 AM IST | Fetches latest NAVs and index prices |
| Every Saturday at 8:00 AM IST | Generates and emails the weekly report |

---

## Troubleshooting

- **Report email not arriving** — check that `REPORT_TO_EMAIL` is correct and check your spam folder.
- **Data not loading** — visit `/api/cron/daily` manually to trigger a refresh.
- **"Supabase URL required" error** — the environment variables weren't saved. Re-check Step 3.
