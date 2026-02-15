## AB TECH

An end-to-end example of how to build and run a modern content business for an AI/ML/Data Science audience: publish editorial content, manage it in an admin CMS, and monetize with subscriptions and paywalled access.

At a glance: **Next.js 15 + Prisma/Postgres (Supabase) + Upstash Redis + Stripe/Telebirr + Cloudinary**.

### What problem it solves
Content products often stall between “nice UI” and “real business”: authentication, editorial workflows, paywalls, subscriptions, media hosting, and operational glue. AB TECH is a reference implementation that brings these pieces together into a single Next.js app.

### Highlights
- **Editorial CMS**: admin UI and APIs for managing content, categories, tags, and settings.
- **Access control**: premium articles are enforced server-side; monthly reading limits are enforced server-side with Redis.
- **Auth**: Credentials (password), OTP email login, and OAuth (Google/GitHub) via NextAuth.
- **Payments**: Stripe checkout + webhooks, Telebirr initiate/status/callback flows.
- **Media & documents**: Cloudinary uploads and PDF delivery/proxy endpoints.
- **Realtime (optional)**: Socket.IO server with origin allowlist (custom server).

### Tech stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Route Handlers, NextAuth
- **Data**: Prisma + PostgreSQL (Supabase recommended)
- **Cache/rate limits**: Upstash Redis
- **Payments**: Stripe, Telebirr
- **Media**: Cloudinary

### Project structure
- `src/app`: routes, pages, and API route handlers (`src/app/api/**`)
- `src/components`: UI and feature components
- `src/lib`: integrations (auth, email, redis, cloudinary, payments)
- `prisma`: schema, migrations, seed
- `server.ts`: custom server (Next + Socket.IO)

### Getting started (local)
1) **Install**

```bash
npm ci
```

2) **Configure environment**
- Copy `docs/env.example` → your local `.env`
- Fill at least: `DATABASE_URL`, `NEXTAUTH_SECRET`, Redis, SMTP

3) **Database (Postgres)**
- Create a Postgres database (Supabase or local Postgres)
- Run migrations:

```bash
npm run db:migrate
```

4) **Run dev**

```bash
npm run dev
```

### Important configuration notes
- **Supabase**: use the **Direct connection string** as `DATABASE_URL`.
- **Redis**: required in production for OTP/rate limits and server-side reading limits.
- **OTP email**: requires SMTP configured (`SMTP_*` + `SENDER_EMAIL`).
- **Socket.IO**: in production set `SOCKET_IO_ORIGINS` to a comma-separated allowlist.
- **Reading limits**: controlled by `ENFORCE_VIEW_LIMITS` (defaults to true in production).

### Scripts
- **dev**: `npm run dev`
- **build**: `npm run build`
- **start (prod)**: `npm run start`
- **migrations (dev)**: `npm run db:migrate`
- **migrations (prod)**: `npm run db:migrate:deploy`

### Deploy checklist (quick)
- Set env vars from `docs/env.example`
- Run `npm ci`
- Run `npm run db:migrate:deploy`
- Run `npm run build`
- Start with `npm run start`

