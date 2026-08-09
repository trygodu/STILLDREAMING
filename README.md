# Still Dreaming

A rebuild of [iamstilldreaming.com](https://iamstilldreaming.com) that argues its own case: the
site itself is a working demo of a website + automated prospect-tracking system + AI chatbot +
lead-gen funnels, all wired together — not screenshots of past work.

## What's actually running here

- **Marketing site** — Next.js App Router, Tailwind, dark theme, creative-agency-styled with jade
  as the accent. Pages: home, about, proof (`/work`), services, contact, and a lead-magnet funnel
  (`/audit` → `/thank-you`).
- **Lead tracking system** — every contact form, audit-funnel submission, and chatbot conversation
  that yields an email becomes a `Lead` row: scored, source-attributed (UTM/referrer/landing page),
  and timestamped. The audit funnel also captures the lead's own website URL (required there —
  it's what the audit runs against). See `src/lib/leads.ts`.
- **AI pitch-deck generator** — a "Generate" action on each lead in the admin dashboard drafts a
  personalized proposal (Claude, via tool-use for structured output) grounded in what the lead
  actually said plus real signals fetched from their own site (title, meta description, mobile
  viewport tag, response time — `src/lib/site-audit.ts`), then renders it as a real downloadable
  `.pptx` (`src/lib/pitchDeck.ts`, via `pptxgenjs`). Demo mode without `ANTHROPIC_API_KEY` still
  produces a real deck from a deterministic template. Logged as a `PITCH_DECK_GENERATED` activity.
- **AI chatbot** — a floating widget (`src/components/ChatWidget.tsx`) backed by `/api/chat`, which
  calls the Anthropic Messages API directly when `ANTHROPIC_API_KEY` is set. Without a key it runs
  in a clearly-labeled demo mode with deterministic responses, so the lead-capture flow still works
  end to end. It also extracts an email from the conversation and auto-creates a lead.
- **Automation** — new leads trigger `notifyNewLead` (`src/lib/notify.ts`), which emails via Resend
  if `RESEND_API_KEY` is set, or logs + records the notification as "queued" otherwise. Every lead
  gets an `Activity` audit trail (created, status changes, chat hand-off, email sent/queued).
- **Admin dashboard** — `/admin`, protected by a real account (email + password), not a shared
  secret. The first visit ever creates the owner account; every visit after that requires signing
  in. Shows a KPI row (leads, avg. score, win rate, page views, unique visitors, chat→lead rate),
  day-by-day trend charts, breakdowns (source, pipeline stage, top pages, top campaigns), a recent
  activity feed, and the full lead table with inline status updates.
- **Page-view / attribution tracking** — `src/components/PageViewTracker.tsx` beacons every page
  view (path, referrer, UTM params) to `/api/track`.

Everything is backed by Postgres + Prisma (`prisma/schema.prisma`). Postgres is required rather than
SQLite because the app targets serverless hosting (Vercel) — a SQLite file wouldn't persist between
requests there. Any Postgres works: [Neon](https://neon.tech), [Supabase](https://supabase.com),
Prisma Postgres, Vercel Postgres, RDS, or a local instance.

**Migrations run automatically on every build** (`prisma migrate deploy && next build` — see
`package.json`), so a fresh production database gets its tables created on first deploy without a
manual step.

## Getting started

```bash
npm install
cp .env.example .env      # then set DATABASE_URL to a real Postgres connection string
npx prisma migrate dev    # applies the schema
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Visit `/admin` — since no account exists yet,
you'll be prompted to create the owner account (email + password) on the spot.

## Environment variables

See `.env.example` for the full list. `DATABASE_URL` is required; every other integration is
optional and degrades gracefully:

| Variable | Purpose | Without it |
| --- | --- | --- |
| `DATABASE_URL` | Prisma Postgres datasource | Required — app can't start without it |
| `ANTHROPIC_API_KEY` | Live chatbot responses | Chatbot runs in demo mode |
| `RESEND_API_KEY` / `LEAD_NOTIFICATION_EMAIL` | Email notification on new lead | Notification is logged + recorded as queued instead of sent |
| `ADMIN_SESSION_SECRET` | Signs the admin login session cookie | Falls back to an insecure dev value — set this in production |

## Deploying (Vercel)

1. Import the repo at [vercel.com](https://vercel.com) → New Project.
2. Provision a Postgres database (Vercel's own Postgres integration, or Neon/Supabase) and set
   `DATABASE_URL` in the project's environment variables — this is the step most likely to be
   missed, and without it every DB-backed route (leads, chat, admin, tracking) fails outright.
3. Set `ADMIN_SESSION_SECRET` to a real random value (e.g. `openssl rand -hex 32`).
4. Add `ANTHROPIC_API_KEY` / `RESEND_API_KEY` whenever you have them — the site works without them.
5. Deploy. The build runs `prisma migrate deploy` automatically, so the database schema is created
   or updated on every deploy — no manual migration step.
6. Visit `/admin` on the live URL once to create the owner account.

## Tech stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Prisma 7 (Postgres via
`@prisma/adapter-pg`) · Anthropic Messages API · pptxgenjs.

## Project structure

```
prisma/schema.prisma          User, Lead, Activity, ChatMessage, PageView models
src/lib/db.ts                 Prisma client singleton (driver adapter)
src/lib/leads.ts               Lead creation + scoring
src/lib/notify.ts              Email notification (Resend or demo-mode log)
src/lib/chat.ts                Anthropic call + demo-mode fallback
src/lib/auth.ts                Session token signing + password hashing (scrypt)
src/lib/users.ts                Account creation / credential verification
src/lib/analytics.ts            Day-bucketing + breakdown helpers for the dashboard
src/lib/site-audit.ts           Lightweight, SSRF-guarded fetch of a lead's own site
src/lib/pitchDeck.ts             Claude-drafted deck content + pptxgenjs slide builder
src/app/(site)/                Marketing pages (shares header/footer/chat widget)
src/app/admin/                 Account-gated analytics dashboard + lead pipeline
src/app/api/                   leads, chat, track, admin/signup, admin/login, admin/logout,
                                admin/leads/[id]/status, admin/leads/[id]/pitch-deck
src/components/                ChatWidget, LeadForm, SiteHeader/Footer, PageViewTracker
src/components/admin/          StatTile, BarList, TrendBars (dashboard chart primitives)
```
