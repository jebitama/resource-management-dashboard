# Real-Time Resource Management Dashboard

<div align="center">

**Enterprise-Grade Infrastructure Analytics & Role-Based Access Platform**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Vercel Serverless](https://img.shields.io/badge/Vercel-Serverless-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![Upstash](https://img.shields.io/badge/Upstash-Redis/QStash-00E9A3?style=flat-square&logo=upstash)](https://upstash.com)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=flat-square&logo=clerk)](https://clerk.com)

*A production-ready platform demonstrating enterprise-level React architecture, serverless backend integrations, Role-Based Access Control (RBAC), Upstash rate-limiting, and deep enterprise UX patterns.*

</div>

---

## 🏗 Full-Stack Architecture

This project follows a strict **feature-based architecture** combined with a **Vercel Serverless Edge API**, designed for maximum scalability in high-performance enterprise workloads.

```text
/
├── api/                    # Vercel Serverless Functions (Backend)
│   ├── _utils/             # Shared serverless utilities (db, ratelimit, auth)
│   ├── admin/              # Elevated privilege endpoints
│   ├── jobs/               # QStash background job triggers
│   └── webhooks/           # Clerk & QStash signature-verified webhooks
├── prisma/                 # PostgreSQL Database Schema & Config
├── public/                 # Static Assets (robots.txt, etc)
└── src/                    # React Frontend
    ├── app/                # App shell, theme providers
    ├── components/ui/      # Reusable design system primitives (Skeletons, Badges)
    ├── features/           # Domain-driven feature modules
    │   ├── admin/          # RBAC requests & user management directory
    │   ├── auth/           # Custom Clerk identity flows
    │   ├── dashboard/      # Main infrastructure metrics view
    │   ├── live-feed/      # Real-time WebSocket event log
    │   └── resources/      # Infinite-scroll virtualized data management
    ├── graphql/            # Apollo Client integrations
    ├── types/              # Domain-specific TypeScript declarations (resources, queries, common)
    └── store/              # Zustand state management
```

## ⚡ Technical Highlights

### 1. Identity & Role-Based Access Control (RBAC)
- **Clerk Identity Hub:** Highly-customized Google & Email Auth using `@clerk/clerk-react`.
- **Identity Synthesis:** A Vercel Serverless Webhook securely intercepts `user.created` Svix events. Additionally, the `requireAuthRole` middleware performs **Identity Synchronization**—fetching full name and email data via `getClerkClient().users.getUser(userId)` to ensure local Prisma records are always populated with source-of-truth metadata during their first session.
- **Admin Elevation Workflow:** Restricted users can submit Justification Petitions. `ADMIN`/`SUPERADMIN` users unlock the exclusive **Admin Console** where they can audit requests, escalate permissions, and modify backend database roles interactively.

### 2. Upstash Redis Rate Limiting
The Vercel API is strictly protected against aggressive polling by **Upstash Sliding Window limiters**.
- Configurations are decoupled (e.g., `readAccess: 20/min`, `authAccess: 5/min`) preventing serverless cost spikes.
- Vercel effectively caches instantiated Upstash clients natively during cold boots for low-latency throughput.
- Enforced HTTP Headers (`X-RateLimit-*`) are attached to all API responses automatically.

### 3. Asynchronous Job Queues via Upstash QStash
Heavy computational workloads (like end-of-month SLA rollups) bypass Vercel's standard 10s maximum execution limits:
1. An admin triggers the background queue via `/api/jobs/trigger-report` or users request admin access.
2. The payload is offloaded over HTTP directly to Upstash QStash.
3. QStash orchestrates retries and executes the respective webhook endpoints (e.g. `notify-admin`). 
4. **Edge Security:** The webhook strictly verifies the raw NodeJS stream against the HMAC signatures (`QSTASH_CURRENT_SIGNING_KEY`) blocking unauthorized local invocations.
5. **Queue Logs:** Admins can actively monitor QStash background job status, delivery times, and errors directly through the dedicated `/queue-logs` dashboard view.

### 4. High-Performance Front-End Data Handling
| Technique | Where | Why |
|---|---|---|
| **`useInfiniteQuery`** | Main Datagrid | Cursor-based database pagination against Postgres paired with an `IntersectionObserver` sentinel auto-loading batches of 50 chunks against Zustand-managed filters. |
| **`react-window`** | Main Datagrid | Highly optimized DOM node virtualization using `FixedSizeList` to render 10,000+ rows smoothly without exhausting client memory. |
| **Optimistic Updates** | Status Toggling | UI patches local Apollo/Tanstack caches instantly before server acknowledgment. Automatic rollback on backend failure. |
| **`useMemo` / `React.memo`** | Table Rows | Stops sibling rows from entirely re-rendering when modifying independent `useState` variables in the parent map. |

### 5. Skeleton Loaders & UX Architecture
- **Enterprise Loading States:** Eliminated jittery "spinners" in favor of spatial-aware `<MetricCardSkeleton>` and `<TableRowSkeleton>` shapes enforcing layout stability (resolving Cumulative Layout Shift SEO penalties).
- **Zustand Persistence:** `localStorage` naturally ties Sidebar Collapses, Themes, and Locale Preferences seamlessly across sessions via Immer modifiers.
- **i18n Readiness:** Complete Internationalization config mapped to React-i18next standard dictionaries.

### 6. Security Configurations
Production builds are heavily locked down for private intranets:
- **`robots.txt` Disallow All:** Prevent rogue Web Crawlers from scraping Vercel Deploy domains.
- **Zero `any` Typings:** Exhaustive discriminated unions validate Socket connections enforcing complete TypeScript rigidness.

### 7. Senior Infrastructure Patterns
- **API Project References:** Unlike basic "flat" repositories, the `api/` directory utilizes a **Dedicated `api/tsconfig.json`** with `moduleResolution: "bundler"`. This enables clean, extensionless imports in serverless functions while maintaining strict type safety for Vercel's build pipeline.
- **Modular Type Architecture:** Core types are decoupled into domain-driven modules (`src/types/resources.ts`, `queries.ts`, etc.) preventing the "God File" anti-pattern and improving IDE performance.
- **Standardized Environment Management:** Coherent environment variable mapping (e.g., `QSTASH_TOKEN`) ensures security configurations are easily auditable across local, staging, and production environments.

---

## 🧰 Tech Stack

| Domain | Technology | Rationale |
|---|---|---|
| **Framework** | Vercel (Next-Gen) + Vite (React) | Combined Edge execution APIs seamlessly backing a high-speed Vite client. |
| **Styling** | Tailwind CSS 4 | Utility-first with precise Glassmorphism / Semantic CSS variables. |
| **Database** | Prisma (PostgreSQL) | Type-safe deterministic querying mapped manually against Auth configurations. |
| **State Layer** | Zustand + Immer | Lightweight, boilerplate-free immutable stores. |
| **Data Fetching** | TanStack Query + Apollo Client | Dual orchestration handling Infinite-Scroll DOM endpoints and dynamic nested mappings. |
| **Identity** | Clerk | Best-in-class multi-tenant user authentication and session management. |
| **Serverless Infra** | Upstash (Redis / QStash) | Serverless data stores for rapid polling checks, queue execution, and rate limiting. |
| **Testing** | Vitest | Industry-standard unit and E2E smoke tests natively integrated into Vite plugins. |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)

### 1. Installation

```bash
git clone <repo-url>
cd resource-management-dashboard
npm install
```

### 2. Database & Environment Setup
Duplicate the sample environment variables mapping your respective API keys:
```bash
cp .env.example .env
```

Hydrate the PostgreSQL DB and trigger initial Prisma generation:
```bash
npx prisma generate
npx prisma db push
```

### 3. Development
Instead of Vite's standard server, this application heavily relies on Vercel's Edge simulation for backend routes:

```bash
npm run dev
# This invokes: vercel dev --listen 3000
```
Open [http://localhost:3000](http://localhost:3000) inside your web browser.

### 4. Testing & Verification

```bash
# Run 50+ vitest/e2e pipeline checks
npm test

# Production build test
npm run build
```

---

<div align="center">
  <sub>Engineered meticulously by a Senior React/Cloud Engineer</sub>
</div>
