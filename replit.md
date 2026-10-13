# Zaytoon Atelier

A contemporary Palestinian fashion storefront based on the user's imported Stitch design, with a MongoDB Atlas catalogue, Clerk accounts, a shopping bag, and private order history.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/zaytoon-store run dev` — run the storefront
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required secret: `MONGODB_URI` — MongoDB Atlas connection string
- Optional env: `MONGODB_DB_NAME` — defaults to `zaytoon_atelier`
- Clerk authentication uses the Replit-managed `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Store DB: MongoDB Atlas via the MongoDB driver
- Authentication: Clerk with backend identity verification and a same-project proxy
- Frontend: React, Vite, Tailwind, Wouter, TanStack Query
- Validation: generated Zod schemas
- API codegen: Orval (from OpenAPI spec)
- API build: esbuild

## Where things live

- `artifacts/zaytoon-store` — storefront and public brand assets
- `artifacts/zaytoon-store/design-reference` — imported Stitch visual references
- `artifacts/api-server/src/lib/mongodb.ts` — MongoDB connection, record shapes, and starter catalogue
- `artifacts/api-server/src/routes/store.ts` — catalogue and protected order endpoints
- `lib/api-spec/openapi.yaml` — API contract; regenerate clients and validation after edits

## Architecture decisions

- Preserve the existing Zaytoon Atelier name and visual identity; do not substitute a generic shop template.
- The user explicitly requires MongoDB Atlas. The workspace's PostgreSQL scaffolding is not the storefront database.
- Clerk owns password validation, hashing, and secure sessions. Do not store passwords in MongoDB or browser storage.
- Orders derive ownership from the verified session, never a browser-supplied user ID.

## Product

- Editorial homepage with featured products, collections, new arrivals, craft, and brand story.
- MongoDB-backed shop search, category filters, sorting, and product detail pages.
- Persistent browser bag with size selection, quantities, item removal, and subtotal.
- Real accounts, protected account page, and private order history.
- Order submission rechecks prices and stock server-side and saves the order transactionally.
- Online payment, delivery calculations, and returns processing are not implemented; the UI must not imply that money was collected or a shipment was dispatched.

## User preferences

- Match the imported Stitch layout, imagery, colours, typography, and spacing as closely as possible.
- Never simulate successful catalogue loading, registration, authentication, or order retrieval.
- Keep secrets on the server; show clear setup and connection errors.

## Gotchas

- The first successful catalogue request creates indexes and seeds six starter products only when the collection is empty. Orders are not seeded.
- Atlas must have a database user with read/write access and Network Access rules permitting the application.
- React dependency changes can leave Vite optimized bundles stale. Reoptimization is required if runtime versions disagree despite matching installed packages.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
