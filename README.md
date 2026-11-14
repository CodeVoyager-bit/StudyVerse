# StudyVerse

A study companion for students: dashboard, tasks, notes, pomodoro timer, weekly planner, CGPA calculator and a daily quote.
Built with Next.js 16 (App Router), React 19, Tailwind CSS 4 and Supabase (auth + Postgres).

Live: https://study-verse-ten.vercel.app

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key
   (Supabase Dashboard → Project Settings → API).
3. In the Supabase Dashboard → SQL Editor, run the migrations in order:
   - `supabase/migrations/0001_schema_and_rls.sql` — tables, row-level security, seeded quotes
   - `supabase/migrations/0002_v2.sql` — pomodoro sessions, planner blocks, saved CGPA, note tags
   Both are idempotent (safe to re-run).
4. Optional, for "Continue with Google": Supabase Dashboard → Authentication → Providers → Google
   (needs a Google Cloud OAuth client ID and secret), then add `https://<your-domain>/auth/callback`
   and `http://localhost:3000/auth/callback` under Authentication → URL Configuration → Redirect URLs.
5. `npm run dev`

## Scripts

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Dev server                                     |
| `npm run build`     | Production build                               |
| `npm run lint`      | ESLint (Next core-web-vitals + TypeScript)     |
| `npm run typecheck` | `tsc --noEmit`                                 |
| `npm test`          | Node's built-in test runner (`lib/*.test.mjs`) |

CI runs all of the above on every pull request (`.github/workflows/ci.yml`).

## Layout

```
app/
  layout.tsx              fonts, theme bootstrap script, global CSS
  globals.css             "Paper bento" tokens (light-dark()), component classes (.btn, .card, .tile, .chip …)
  (public)/               home, login, register, forgot-password, reset-password  — top nav
  (app)/                  signed-in shell: sidebar on desktop, tab bar on mobile
    dashboard/            stats, up-next tasks, week chart, today's plan, mini timer, quote, recent notes
    task/                 Server Component + Server Actions; ?filter=soon|overdue|done
    note/                 search (?q=), tags (?tag=), markdown preview
    pomodoro/             timer hook in lib/use-pomodoro.ts; settings in localStorage; sessions saved to Supabase
    planner/              weekly timetable (Mon–Sun, 06:00–23:00)
    gpa/                  10-point or 4.0 scale, saved per user
    quotes/               random quote, server-rendered
  auth/callback/          OAuth + email-link code exchange
  components/             Sidebar, TopNav, ThemeToggle, SubmitButton, GoogleButton
lib/                      gpa.mjs, streak.mjs (with tests), time.ts, use-pomodoro.ts
proxy.ts                  redirects signed-out visitors away from every (app) route
utils/supabase/           browser + server Supabase clients
supabase/migrations/      SQL to run in the Supabase dashboard
```

## Theme

Light and dark share one token set via CSS `light-dark()`. The toggle writes `theme` to `localStorage`
and sets `data-theme` on `<html>`; with no saved choice the system preference applies.

## Deploy

Vercel auto-detects Next.js. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
in Project → Settings → Environment Variables.
