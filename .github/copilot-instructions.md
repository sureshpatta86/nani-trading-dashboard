# Nani Trading Dashboard - Copilot Instructions

## Architecture Overview

Next.js 14 App Router trading dashboard for Indian stock market (NSE/BSE). All pages are client components (`"use client"`) that fetch data via API routes.

**Data Flow:** Client Pages → API Routes (`/api/*`) → Prisma ORM → PostgreSQL

**Key directories:**
- `src/app/api/` - REST API routes (intraday, portfolio, ai, dashboard/stats, profile)
- `src/lib/` - Shared utilities (auth, prisma, validations, rate-limit, stock-api)
- `src/types/trading.ts` - Centralized TypeScript types and constants
- `src/components/ui/` - shadcn/ui components
- `messages/` - i18n translations (en.json, te.json)

## Development Commands

```bash
docker compose up -d          # Start PostgreSQL
npm run dev                   # Development server
npm run test                  # Run vitest tests
npx prisma migrate dev        # Apply migrations
npx prisma studio             # Database GUI
```

## Code Patterns

### Validation with Zod
All API input uses Zod schemas from `src/lib/validations.ts`. Always:
- Apply `.trim()` to user string inputs before validation
- Use `.transform()` for normalization (uppercase, dates)
- Use `validate()` helper for consistent error responses

```typescript
// Example from validations.ts
script: z.string()
  .transform((val) => val.trim())
  .pipe(z.string().min(1, "Required").max(50, "Too long"))
  .transform((val) => val.toUpperCase()),
```

### API Route Structure
All API routes follow this pattern:
1. Authenticate with `await auth()` from `@/lib/auth`
2. Check rate limit with `withRateLimit(request, userId, "standard"|"auth"|"ai")`
3. Validate input with Zod schemas
4. Use Prisma for database operations
5. Transform response to match frontend expectations

### Data Fetching (Frontend)
Use SWR for data fetching with caching:
```typescript
const { data, mutate, isLoading } = useSWR(
  status === "authenticated" ? "/api/endpoint" : null,
  fetcher,
  { revalidateOnFocus: false, dedupingInterval: 60000 }
);
```

### Internationalization
Use `next-intl` with translations in `messages/` folder:
```typescript
const t = useTranslations("intraday");  // Page-specific
const tc = useTranslations("common");   // Shared strings
```

## Database Schema (Prisma)

Key models in `prisma/schema.prisma`:
- `User` - Auth with Google OAuth or credentials, has `initialCapital`
- `IntradayTrade` - Daily trades with `script`, `buySell`, `entryPrice`, `exitPrice`, `mood`, `followSetup`
- `PortfolioStock` - Long-term holdings with `symbol`, `averagePrice`, `currentPrice`

**Mood tracking:** Uses enum `MOODS = ["CALM", "CONFIDENT", "ANXIOUS", "FOMO", "PANICKED", "OVERCONFIDENT"]`

## Testing

Tests use Vitest with React Testing Library. Setup file mocks Next.js hooks:
- Place tests in `src/__tests__/` directory
- Mock `next/navigation`, `next-auth/react`, `next-intl`
- Run `npm run test:coverage` for coverage report

## Currency & Formatting

All monetary values in INR. Use `formatINR()` from `src/lib/utils.ts`:
```typescript
formatINR(1234.56) // "₹1,234.56"
```

## External APIs

- **Finnhub** - Stock prices via `src/lib/stock-api.ts`
- **OpenAI GPT-4o-mini** - Trading insights via `src/lib/openai.ts`
- **Upstash Redis** - Rate limiting (optional, graceful fallback)
