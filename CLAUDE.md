# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

**Nani Trading Dashboard** is an AI-assisted trading journal and portfolio tracker for Indian equity traders (NSE/BSE). It covers intraday trade logging, long-term holdings, deposits/withdrawals, performance analytics, and AI-generated insights over the user's own trading history.

Core domain entities (see `prisma/schema.prisma`): `User`, `IntradayTrade`, `PortfolioStock`, `Deposit`, `Withdrawal`, plus NextAuth's `Account` / `Session` / `VerificationToken`.

## Tech stack

- **Runtime**: Node.js 18+, npm
- **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix primitives), Lucide icons
- **Data**: Prisma 5 + PostgreSQL, SWR on the client, zod for validation
- **Auth**: NextAuth 5 (beta) — Google OAuth + email/password (bcryptjs)
- **External**: Finnhub (quotes), OpenAI GPT-4o-mini (insights), Upstash (rate limiting)
- **Testing**: Vitest + jsdom + Testing Library
- **Charts/exports**: Recharts, ExcelJS, PapaParse

## Commands

```bash
npm run dev            # start dev server
npm run build          # runs `prisma generate && next build`
npm start              # start production server
npm run lint           # ESLint (Next + TS config)
npm run test           # Vitest watch
npm run test:run       # single-pass, CI-style
npm run test:coverage  # v8 coverage report
```

Database workflow:

```bash
docker compose up -d                 # local Postgres on port 5433
npx prisma migrate dev --name <name> # create + apply a migration
npx prisma studio                    # inspect data
npx prisma generate                  # regenerate client (also runs on postinstall/build)
```

## Project layout

```
src/
├── app/                    # App Router: pages + /api routes
│   ├── api/                # auth, portfolio, intraday, ai, stock, dashboard, profile
│   ├── auth/signin/        # login
│   ├── intraday/           # trade logging
│   ├── portfolio/          # long-term holdings
│   ├── insights/           # AI analysis
│   ├── reports/            # performance reports
│   ├── import/             # CSV import
│   ├── stock/[symbol]/     # per-symbol view
│   └── layout.tsx, page.tsx
├── components/
│   ├── ui/                 # shadcn primitives — compose, don't fork
│   ├── dashboard/ trading/ insights/ charts/ tools/
│   └── navbar.tsx, command-menu.tsx, theme-provider.tsx, ...
├── lib/
│   ├── prisma.ts           # shared PrismaClient — always import this
│   ├── auth.ts             # NextAuth config
│   ├── stock-api.ts        # Finnhub
│   ├── openai.ts           # OpenAI client
│   ├── rate-limit.ts       # Upstash rate limit
│   ├── validations.ts      # zod schemas
│   └── utils.ts
├── hooks/  types/  i18n/   # (next-intl)
├── middleware.ts           # auth gate
└── __tests__/              # Vitest specs (mirrors src tree)
prisma/
├── schema.prisma
└── migrations/             # keep migrations ordered; don't hand-edit applied ones
```

Import alias: `@/*` → `src/*`.

## Auth

- `src/middleware.ts` requires a session for everything except `/auth/*` and `/api/auth/*`. Unauthenticated users are redirected to `/auth/signin` with a `callbackUrl`.
- API route handlers should check the session and return **401** when absent — mirror the pattern already used in `src/app/api/**`.
- Passwords are hashed with `bcryptjs`. Never log or return the hash.

## Environment variables

Required (no `.env.example` is committed yet — create `.env.local`):

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `FINNHUB_API_KEY`
- `OPENAI_API_KEY`

Optional: `DATABASE_URL_UNPOOLED`, Upstash credentials for rate limiting.

## Conventions

- **TypeScript strict** is on. No `any` unless there is a comment explaining why.
- **Validate at the boundary**: API routes parse input with zod schemas from `src/lib/validations.ts`. Add new schemas there rather than inline.
- **Prisma**: always `import { prisma } from "@/lib/prisma"`. Never `new PrismaClient()` inside a route handler — it leaks connections in dev.
- **External APIs**: call Finnhub via `src/lib/stock-api.ts` and OpenAI via `src/lib/openai.ts`. Add new helpers there, not in route handlers.
- **Keep API routes thin**: handlers do auth + validation + response shaping. Business logic lives in `src/lib`.
- **UI**: compose shadcn primitives in `src/components/ui`; don't fork them. App-specific composites go in the feature folder (`dashboard/`, `trading/`, …).
- **Server vs client**: default to server components; add `"use client"` only when you need state, effects, or browser APIs.

## Testing

- Framework: Vitest + jsdom, setup in `src/__tests__/setup.ts`.
- Layout: mirror the `src/` tree under `src/__tests__/` (see `components/stats-cards.test.tsx`, `lib/rate-limit.test.ts`, `lib/validations.test.ts`).
- Prefer real zod schemas and real utility functions in tests; mock only the network / Prisma boundary.
- Use `npm run test:run` for a single pass (what CI-style workflows should use).

## Things to watch

- NextAuth is on `5.0.0-beta.30` — APIs may still shift; check the release notes before upgrading.
- Next.js 16 + React 19 are recent; validate patterns against current docs rather than pasting older examples.
- `docker-compose.yml` exposes Postgres on **5433** (not 5432) to avoid clashing with a host install — match that in `DATABASE_URL`.
- `npm run build` runs `prisma generate` first; CI must have `DATABASE_URL` (or at least the schema) available at build time.
