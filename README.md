# Still Dreaming

A rebuild of [iamstilldreaming.com](https://iamstilldreaming.com) that argues its own case: the
site itself is a working demo of a website + automated prospect-tracking system + AI chatbot +
lead-gen funnels, all wired together — not screenshots of past work.

## What's actually running here

- **Marketing site** — Next.js App Router, Tailwind, dark theme. Pages: home, about, proof
  (`/work`), services, contact, and a lead-magnet funnel (`/audit` → `/thank-you`).
- **Lead tracking system** — every contact form, audit-funnel submission, and chatbot conversation
  that yields an email becomes a `Lead` row: scored, source-attributed (UTM/referrer/landing page),
  and timestamped. See `src/lib/leads.ts`.
- **AI chatbot** — a floating widget (`src/components/ChatWidget.tsx`) backed by `/api/chat`, which
  calls the Anthropic Messages API directly when `ANTHROPIC_API_KEY` is set. Without a key it runs
  in a clearly-labeled demo mode with deterministic responses, so the lead-capture flow still works
  end to end. It also extracts an email from the conversation and auto-creates a lead.
- **Automation** — new leads trigger `notifyNewLead` (`src/lib/notify.ts`), which emails via Resend
  if `RESEND_API_KEY` is set, or logs + records the notification as "queued" otherwise. Every lead
  gets an `Activity` audit trail (created, status changes, chat hand-off, email sent/queued).
- **Admin dashboard** — `/admin`, password-protected via `ADMIN_PASSWORD` (signed cookie session,
  `src/lib/auth.ts`). Shows the lead pipeline, scores, attribution, and page-view stats, and lets you
  update a lead's status.
- **Page-view / attribution tracking** — `src/components/PageViewTracker.tsx` beacons every page
  view (path, referrer, UTM params) to `/api/track`.

Everything is backed by Postgres + Prisma (`prisma/schema.prisma`). Postgres is required rather than
SQLite because the app targets serverless hosting (Vercel) — a SQLite file wouldn't persist between
requests there. Any Postgres works: [Neon](https://neon.tech), [Supabase](https://supabase.com),
Prisma Postgres, Vercel Postgres, RDS, or a local instance.

## Getting started

```bash
npm install
cp .env.example .env      # then set DATABASE_URL to a real Postgres connection string
npx prisma migrate dev    # applies the schema
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin dashboard is at `/admin`
(default password `changeme` from `.env.example` — change it before deploying anywhere public).

## Environment variables

See `.env.example` for the full list. `DATABASE_URL` is required; every other integration is
optional and degrades gracefully:

| Variable | Purpose | Without it |
| --- | --- | --- |
| `DATABASE_URL` | Prisma Postgres datasource | Required — app can't start without it |
| `ANTHROPIC_API_KEY` | Live chatbot responses | Chatbot runs in demo mode |
| `RESEND_API_KEY` / `LEAD_NOTIFICATION_EMAIL` | Email notification on new lead | Notification is logged + recorded as queued instead of sent |
| `ADMIN_PASSWORD` | `/admin` login | Login always fails until set |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie | Falls back to an insecure dev value — set this in production |

## Deploying (Vercel)

1. Import the repo at [vercel.com](https://vercel.com) → New Project.
2. Provision a Postgres database (Vercel's own Postgres integration, or Neon/Supabase) and set
   `DATABASE_URL` in the project's environment variables.
3. Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` to real values (not the `.env.example` defaults).
4. Add `ANTHROPIC_API_KEY` / `RESEND_API_KEY` whenever you have them — the site works without them.
5. Run `npx prisma migrate deploy` against the production `DATABASE_URL` once (locally, or as a
   Vercel build step) to create the tables, then deploy.

## Tech stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Prisma 7 (Postgres via
`@prisma/adapter-pg`) · Anthropic Messages API.

## Project structure

```
prisma/schema.prisma          Lead, Activity, ChatMessage, PageView models
src/lib/db.ts                 Prisma client singleton (driver adapter)
src/lib/leads.ts               Lead creation + scoring
src/lib/notify.ts              Email notification (Resend or demo-mode log)
src/lib/chat.ts                Anthropic call + demo-mode fallback
src/lib/auth.ts                Admin session cookie signing
src/app/(site)/                Marketing pages (shares header/footer/chat widget)
src/app/admin/                 Password-gated lead dashboard
src/app/api/                   leads, chat, track, admin/login, admin/logout, admin/leads/[id]/status
src/components/                ChatWidget, LeadForm, SiteHeader/Footer, PageViewTracker
```
