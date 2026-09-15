---
name: apmee-platform
description: >-
  Skill for the APMEE EB Cobre management platform — a PWA React app with
  Supabase backend and GitHub Pages hosting. Use this skill when working on
  any aspect of the APMEE project including architecture decisions, component
  patterns, database schema, RLS policies, deployment, and UI conventions.
---

# APMEE EB Cobre Platform — Project Skill

This skill documents all architectural decisions, conventions, and patterns for
the APMEE EB Cobre management platform (mini-ERP for a parents' association).

---

## 1. Stack Tecnológica (Confirmada)

| Layer              | Technology                              |
| :----------------- | :-------------------------------------- |
| Build / Bundler    | Vite + React 19 + TypeScript            |
| UI Framework       | Tailwind CSS v4 + shadcn/ui (Radix)     |
| Routing            | React Router v7 (BrowserRouter)         |
| Data Fetching      | TanStack Query (React Query) v5         |
| Date Library       | date-fns (locale pt-PT)                 |
| Backend / DB       | Supabase (PostgreSQL + Auth + Storage)  |
| Realtime           | Supabase Realtime (selective tables)    |
| File Storage       | Supabase Storage (private buckets)      |
| Hosting            | GitHub Pages (public repo)              |
| CI/CD              | GitHub Actions (auto-deploy on `main`)  |
| PWA                | vite-plugin-pwa (Workbox)               |

---

## 2. Routing — GitHub Pages SPA Hack

GitHub Pages does not support SPA routing natively. We use `BrowserRouter` with
a custom `404.html` that redirects to `index.html` preserving the path.

- **DO**: Use `<BrowserRouter>` with `basename` set to the repo name if not
  using a custom domain.
- **DO**: Generate a `404.html` in the build output that does the redirect.
- **DO NOT**: Use `HashRouter`.

---

## 3. RBAC Model — Roles × Permission Levels

### Permission Levels (assigned per user, enforced via RLS)

| Level        | Read               | Write                         | Technical (logs, config) |
| :----------- | :----------------- | :---------------------------- | :----------------------- |
| `superadmin` | Everything         | Everything                    | ✅ Full access            |
| `nivel_1`    | All (except tech)  | All                           | ❌ No access              |
| `nivel_2`    | All (except tech)  | All except financial modules  | ❌ No access              |

### Roles (descriptive, association function)

`presidente`, `tesoureiro`, `gestor_social`, `vogal`

- Roles and permission levels are **independent**.
- The `superadmin` level is reserved for `rpmariano@gmail.com`.
- Users are pre-registered in `allowed_users` table — Google OAuth only.

---

## 4. Authentication

- **Provider**: Google OAuth via Supabase Auth.
- **Access Control**: Whitelist in `allowed_users` table. Only pre-registered
  Google emails can log in.
- **RLS**: All tables enforce RLS. Financial tables (`treasury`, `quotas`,
  `financial_movements`) block `INSERT`/`UPDATE`/`DELETE` for `nivel_2` users.

---

## 5. PWA Strategy

- **Offline Level**: Light — cache static assets (HTML/JS/CSS/images) via
  service worker. Data from Supabase requires network.
- **Tooling**: `vite-plugin-pwa` with Workbox.
- **Cache Strategy**: Cache First for static assets, Network First for API.
- **Offline Fallback**: Custom offline page when no network available.

---

## 6. UI/UX Conventions

- **Language**: UI in Portuguese (pt-PT). Code/variables in English.
- **Color Palette** (extracted from logo):
  - Primary: Coral/Salmon `#E8856C` (approx)
  - Secondary: Dark Navy/Grey `#2D3748` (approx)
  - Background: Off-white `#FAFAF8`
  - Text: Black `#1A1A1A`
  - Accents: Soft peach, warm beige
- **Design System**: Pastel cards with rounded corners, bottom navigation bar,
  FAB for "Add Event".
- **Navigation**: Bottom Nav (Home, Calendar, Email*, Hamburger Menu).
  *Email module is Phase 2.

---

## 7. External Entities (No Login)

These are **data records** in the app, NOT users with authentication:
- Pais (Parents)
- Professores (Teachers)
- Parceiros (Partners)
- Fornecedores (Suppliers)
- Associados (Members)

---

## 8. Phasing

### Phase 1 (MVP)
- Auth (Google OAuth + RBAC + RLS)
- Dashboard / Home
- Contacts module
- Events module + Calendar
- Tasks (To-Do)
- Inventory
- Treasury & Quotas
- PWA setup
- GitHub Actions CI/CD
- Supabase project setup

### Phase 2
- Gmail API integration (Edge Functions, cron sync, inbox cache)
- Email module in UI
- Notification bell (unread email count)

---

## 9. Project Structure Convention

```text
src/
├── components/       # Shared UI components (shadcn/ui based)
│   ├── ui/           # shadcn/ui primitives
│   └── layout/       # Layout components (BottomNav, AppShell, etc.)
├── features/         # Feature modules (contacts, events, treasury, etc.)
│   └── <module>/
│       ├── components/
│       ├── hooks/
│       ├── api/      # Supabase queries for this module
│       └── types.ts
├── lib/              # Utilities (supabase client, date helpers, etc.)
├── hooks/            # Shared hooks (useAuth, usePermissions, etc.)
├── pages/            # Route pages
├── providers/        # Context providers (Auth, Theme, QueryClient)
├── types/            # Global TypeScript types
└── assets/           # Static assets (logo, icons)
```

---

## 10. Supabase Conventions

- **Table names**: snake_case, plural (e.g., `events`, `contacts`, `tasks`).
- **Column names**: snake_case (e.g., `created_at`, `updated_by`).
- **All tables** must have: `id` (UUID, PK), `created_at`, `updated_at`.
- **RLS enabled** on every table without exception.
- **Soft deletes** preferred (`deleted_at` timestamp) for audit trail.
