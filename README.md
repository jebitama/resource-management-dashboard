# Resource Management Dashboard

<div align="center">

**Enterprise-Grade Real-Time Infrastructure Analytics**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat-square&logo=prisma)](https://prisma.io)

*A production-ready dashboard demonstrating senior-level React architecture, real-time data handling, and enterprise UX patterns. Built as a technical showcase for private enterprise environments.*

</div>

---

## 🏗 Architecture Overview

This project follows a **feature-based architecture** with clear separation of concerns, designed for team scalability and maintainability in large codebases.

```
src/
├── app/                    # Application shell, providers, context
│   └── ThemeProvider.tsx    # React Context + Zustand theme sync
├── components/ui/          # Reusable design system primitives
│   ├── Button.tsx           # Variant-based button (primary, ghost, outline...)
│   ├── Card.tsx             # Composable card (Header, Content, Footer)
│   ├── Input.tsx            # Form input with error states & addons
│   ├── Badge.tsx            # Color-coded label component
│   ├── Skeleton.tsx         # Loading state skeletons with presets
│   ├── EmptyState.tsx       # Empty/no-results feedback component
│   ├── StatusBadge.tsx      # Resource status indicator (memoized)
│   ├── ThemeSwitcher.tsx    # Animated dark/light toggle
│   ├── LanguageSwitcher.tsx # i18n dropdown selector
│   ├── SystemHealthTicker.tsx # Real-time header metrics
│   ├── Sidebar.tsx          # Collapsible navigation
│   ├── Header.tsx           # Glassmorphism top bar
│   └── index.ts             # Barrel exports
├── features/               # Feature modules (domain-driven)
│   ├── dashboard/           # GraphQL analytics view
│   ├── resources/           # Virtualized data table (10K+ rows)
│   └── live-feed/           # WebSocket real-time event log
├── graphql/                 # Apollo Client, queries, mocks
├── hooks/                   # Shared custom hooks
│   └── useSocketData.ts     # WebSocket simulation (typed)
├── i18n/                    # Internationalization config + locales
├── lib/                     # Pure utilities (cn, formatters, mock data)
├── store/                   # Zustand state management
├── types/                   # Global TypeScript interfaces
└── __tests__/               # Vitest unit tests
```

## ⚡ Technical Highlights

### State Management — Zustand + Immer

The store uses **Zustand** with **Immer middleware** for clean immutable updates. User preferences (theme, locale, sidebar state) are persisted to `localStorage` via Zustand's `persist` middleware, while transient state (filters, pagination) resets on page reload.

```typescript
// Immer allows "mutative" syntax that produces immutable updates
setSearchFilter: (search) =>
  set((state) => {
    state.filters.search = search;
    state.pagination.page = 1; // Reset on filter change
  }),
```

### Data Fetching — TanStack Query with Optimistic Updates

Resource mutations use **optimistic updates** — the UI updates instantly while the server processes the request. If the mutation fails, the cache rolls back automatically:

```typescript
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey: resourceKeys.all });
  const previous = queryClient.getQueriesData({ queryKey: resourceKeys.lists() });
  // Optimistically update cache
  queryClient.setQueriesData(...);
  return { previous }; // Snapshot for rollback
},
onError: (_err, _vars, context) => {
  context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
},
```

### GraphQL — Apollo Client with Normalized Caching

Apollo's `InMemoryCache` uses **type policies** for entity normalization and paginated query merging:

- `Resource`, `TeamMember`, `Project` identified by `id` field
- Relay-style cursor pagination with `merge` functions
- Custom mock link simulating realistic network latency (200–500ms)

### Performance — Virtualization & Memoization

| Technique | Where | Why |
|---|---|---|
| `react-window` (FixedSizeList) | Resource Table | Renders only visible rows from 10,000+ items |
| `React.memo` | TableRow, MetricPill, StatusBadge | Prevents re-renders of sibling rows during updates |
| `useMemo` | Sorted/filtered data, chart data | Avoids re-sorting 10K items on unrelated re-renders |
| `useCallback` | Event handlers passed to children | Maintains referential equality for memoized children |

Every usage includes inline **comments explaining the rationale** — not just what, but *why*.

### WebSocket Simulation — Typed Real-Time Stream

The `useSocketData` hook simulates a WebSocket with:
- **Discriminated union** message types (`SYSTEM_HEALTH | MARKET_TICKER | ALERT | RESOURCE_UPDATE`)
- Connection state machine (`connecting → connected → disconnected`)
- Bounded message history to prevent memory leaks
- Cleanup on unmount via `useRef` + `useEffect`

### TypeScript — Strict & Exhaustive

- Zero `any` types
- **Discriminated unions** for WebSocket messages enable exhaustive `switch` matching
- `as const` assertions for enum-like objects with derived types
- Generic table column definitions
- All GraphQL queries fully typed

### Prisma — Database Modeling

Full relational schema with `Resource`, `TeamMember`, `Project`, `Allocation`, and `AuditLog` models:

- Proper indexes for query performance
- Cascading deletes on relations
- Seed script generating 50+ resources, 24 team members, 12 projects
- Shows real fullstack capability beyond frontend

### UX Polish

- **Framer Motion**: `AnimatePresence` page transitions, `layoutId` shared-layout animations on metric cards, spring-based sidebar collapse
- **Dark/Light theme** with `localStorage` persistence and CSS custom properties
- **i18n**: English + Bahasa Indonesia with instant language switching
- **WCAG AA** contrast ratios on all theme colors
- **Keyboard accessibility**: All interactive elements have `aria-labels`, `focus-visible` rings, and keyboard navigation
- **`cn()` utility**: `clsx` + `tailwind-merge` for clean, conflict-free class composition

---

## 🧰 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | React 18 + Vite | Fast HMR, modern bundling, React concurrent features |
| **Language** | TypeScript (strict) | Type safety, IDE intelligence, self-documenting code |
| **Styling** | Tailwind CSS 4 | Utility-first with semantic CSS variable theming |
| **State** | Zustand + Immer | Lightweight, boilerplate-free, immutable updates |
| **Server State** | TanStack Query | Caching, pagination, optimistic updates, retry |
| **GraphQL** | Apollo Client | Normalized caching, type policies, dev tools |
| **Animation** | Framer Motion | Layout animations, presence transitions, spring physics |
| **Virtualization** | react-window | Render only visible rows from massive datasets |
| **i18n** | react-i18next | Industry-standard, lazy-loadable, pluralization |
| **Database** | Prisma + SQLite | Type-safe ORM, migrations, seed scripts |
| **Charts** | Recharts | Declarative, responsive, composable with React |
| **Testing** | Vitest + Testing Library | Vite-native, fast, compatible with Jest ecosystem |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone <repo-url>
cd resource-management-dashboard
npm install
```

### Database Setup (Optional)

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📊 Scalability Considerations

1. **Feature Isolation**: Each feature module is self-contained with its own hooks, components, and data layer. New features can be added without modifying existing code.

2. **Lazy Loading Ready**: Feature views can be wrapped with `React.lazy()` + `Suspense` for code-splitting in production.

3. **Pagination Architecture**: GraphQL queries use cursor-based pagination (Relay spec) with Apollo cache merging — scales to millions of records.

4. **Virtual Rendering**: The data table renders 20–30 DOM nodes regardless of dataset size (10K, 100K, or 1M rows).

5. **State Normalization**: Apollo's normalized cache ensures entity updates propagate to all views without manual synchronization.

---

## 📝 License

This project serves as a **technical demonstration** of senior-level frontend and fullstack capabilities in private enterprise environments.

---

<div align="center">
  <sub>Built with precision by a Senior React/TypeScript Engineer</sub>
</div>
