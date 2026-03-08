# Auto-Sent CRM

A full Customer Relationship Management (CRM) app with **sales** (contacts, companies, deals, pipeline, activities), **support** (tickets), and **marketing** (campaigns, touchpoints). The frontend is a static SPA deployable to **GitHub Pages**; data and auth are handled by **Supabase**.

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Lucide icons
- **Backend**: [Supabase](https://supabase.com) (Postgres, Auth, Row Level Security)
- **Hosting**: GitHub Pages (static build from `dist/`)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migration in `supabase/migrations/20250101000000_initial_schema.sql` to create tables and RLS.
3. In Project Settings → API, copy the **Project URL** and **anon public** key.

### 2. Local env

Copy the example env and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). For GitHub Pages locally with base path, use:

```bash
npm run build
npm run preview
```

Then open the URL shown (e.g. http://localhost:4173/Auto-Sent-CRM/).

### 4. Deploy to GitHub Pages

1. Push the repo to GitHub.
2. In the repo go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to **GitHub Actions**.
4. On each push to `main`, the workflow in `.github/workflows/deploy.yml` builds the app and deploys to Pages.
5. The app will be available at `https://<username>.github.io/Auto-Sent-CRM/`.

Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as **Repository secrets** or **Actions variables** if you need them at build time (e.g. for env substitution). The current build uses client-side env from the browser, so you can also configure Supabase URL/anon key in the app after deploy.

## Features

- **Auth**: Sign up / sign in via Supabase Auth; profile (display name) in Settings.
- **Contacts & Companies**: CRUD, list and detail views; link contacts to companies.
- **Deals**: Pipeline (Kanban) and table views; stages (lead → qualified → proposal → negotiation → won/lost); link to contact/company.
- **Activities**: Log calls, meetings, emails; link to contact, company, deal.
- **Tickets**: CRUD with status and priority; link to contact/company.
- **Campaigns**: Create campaigns and add contacts as touchpoints.
- **Dashboard**: Counts for contacts, companies, open deals, open tickets; recent activity.
- **Search**: Global search over contacts, companies, deals, tickets.
- **Settings**: Update display name and view email.

## Repo structure

- `src/` – React app (pages, components, context, lib)
- `supabase/migrations/` – SQL migrations for schema and RLS
- `.github/workflows/deploy.yml` – Build and deploy to GitHub Pages

## Base path

The app is built with `base: '/Auto-Sent-CRM/'` in `vite.config.js` so it works under `https://<username>.github.io/Auto-Sent-CRM/`. To use a different repo or path, change `base` and the workflow accordingly.
