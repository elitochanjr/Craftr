# Craftr

Inventory management app for crafting supplies — hobby and small business use.

## Stack
- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** Neon (serverless Postgres) via `@prisma/adapter-neon`
- **ORM:** Prisma v7 — generated client at `src/generated/prisma/`
- **Auth:** Auth.js v5 (next slice)
- **UI:** Tailwind v4 + shadcn/ui
- **Email:** Resend (future slice)
- **Storage:** Vercel Blob (future slice)
- **Deployment:** Vercel

## Commands
```bash
npm run dev          # start dev server
npm run build        # production build
npx prisma generate  # regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # create + apply migration
```

## Prisma import
Always import from `@/generated/prisma/client`, not `@/generated/prisma`:
```ts
import { PrismaClient } from "@/generated/prisma/client";
```

## Prisma client singleton
`src/lib/prisma.ts` — uses `PrismaNeon` adapter with `PoolConfig`.

## App structure
- `src/app/(app)/` — authenticated app shell (sidebar + bottom nav)
- `src/components/layout/` — Sidebar, BottomNav, Header components
- `prisma/schema.prisma` — all domain models defined up-front
- `.env.example` — all required env vars documented

## Roles
- `ADMIN` — full access
- `STAFF` — limited read/write (cannot create/delete items, manage users, etc.)

## GitHub issues
All work is tracked in GitHub issues. Reference issue numbers in commits.
PRD: issue #1. Scaffold: issue #2. Each slice is a separate issue.
