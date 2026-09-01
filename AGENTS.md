# All Beauty Luxury & Wellness — Agent Instructions

## CRITICAL RULES - MUST FOLLOW

- **ALWAYS reference `database/schema.sql` for exact table structure and column names**
- **NEVER assume column names — verify in schema.sql before writing SQL**
- **NEVER fetch data directly in components with axios or fetch**
- **ALL data fetching MUST be done in Redux store (slices) using `createAsyncThunk`**
- **Components ONLY dispatch actions and select state from the store**
- **NEVER edit `database/schema.sql` directly for schema changes** — write a migration in `database/migrations/` first, apply it, then update `schema.sql` to match
- **UI logging**: use `client/lib/logger.ts` only (not raw `console.*` in components)
- **NEVER patch issues** — fix the root cause of type errors or bugs immediately
- **If `api/swagger.yaml` exists**, update it whenever `api/index.ts` routes or behavior change
- **Relevant UI changes** → update `docs/DESIGN_SYSTEM.md` (and tokens in `client/global.css` / `tailwind.config.ts` when colors or components change)
- **Mobile-responsive**, clean, engaging UI/UX on frontend changes
- Prefer reusable components/utilities when it avoids debt
- **Avoid breaking changes**
- Review chat history before changing code so previously fixed issues are not reintroduced
- **All required API logic stays inline in `api/index.ts`** (Vercel serverless). Do **not** runtime-import from `shared/` or `server/` in the API — `import type` only. Relative runtime imports break prod with `ERR_MODULE_NOT_FOUND`
- **Admin JWT**: all `/api/admin/*` routes except `/api/admin/auth/*` require `Authorization: Bearer` issued by `verifyAdminCode` or `refresh`. Role checks match the admin nav. Do not add DocuSign — contracts use the in-app signature canvas
- **New API work goes in `api/index.ts`**, not `server/`. `server/` is legacy; Vite and Vercel both serve the Express app from `api/index.ts`
- **NO EXCEPTIONS to these rules**

### Package Manager

- **Always use npm** (never pnpm or yarn)

### Backend

- APIs live in `api/index.ts`
- TypeScript throughout
- Single port **8080** for frontend + backend in development
- **If a type issue is generated, fix it immediately** — keep types consistent across `client/`, `api/index.ts`, and `shared/`
- Email is **Resend** (`RESEND_API_KEY` + `SMTP_FROM`). Do not add Nodemailer/SMTP transports
- Map DB errors to friendly API responses (409 duplicate, 400 FK) — never leak raw MySQL/TiDB messages
- **Stripe**: charge catalog `services.price` (never trust client `payment_amount`). Fulfill bookings from `POST /api/stripe/webhook` (`payment_intent.succeeded`) with signature verification + raw body; `confirm-payment` is an idempotent fallback. Admin approve-refund and patient cancel (>24h) must call `stripe.refunds.create`. Do not add `payment_method_types` on PaymentIntents.

### Running Migrations (TiDB Cloud)

DB credentials are in `.env` at the project root. Schema changes: create `database/migrations/YYYYMMDD_HHMMSS_description.sql` (TiDB Cloud Serverless / MySQL 8.0 compatible).

```bash
# Apply all pending files in database/migrations/
npm run db:migrate

# Or apply one file:
DB_PASS=$(grep "^DB_PASSWORD" .env | cut -d'=' -f2-) && \
DB_HOST=$(grep "^DB_HOST" .env | cut -d'=' -f2-) && \
DB_PORT=$(grep "^DB_PORT" .env | cut -d'=' -f2-) && \
DB_USER=$(grep "^DB_USER" .env | cut -d'=' -f2-) && \
DB_NAME=$(grep "^DB_NAME" .env | cut -d'=' -f2-) && \
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  --ssl-mode=REQUIRED --protocol=TCP \
  < database/migrations/YOUR_MIGRATION_FILE.sql
```

- Always use `--ssl-mode=REQUIRED --protocol=TCP`
- After applying, **update `database/schema.sql`** to reflect the new table/column

### Production deploy

```bash
npm run deploy:prod
```

Runs the Vercel inline-monolith gate, `typecheck`, tests, `vercel --prod`, then writes `system_settings.app_version`.

### API integration tests

HTTP tests use `supertest` against `createServer()` and seed `@example.test` rows in the shared TiDB. Emails are dry-run when `VITEST=true`.

```bash
npm test                 # unit + API HTTP suites
npm run test:api         # api/**/*.test.ts only
npm run test:cleanup-fixtures          # purge leftover @example.test fixtures
npm run test:cleanup-fixtures -- --dry-run
```

Suites must call `cleanupIntegrationTestFixtures(pool, { runId: RUN_ID })` in `afterAll`. Never seed real customer emails.

### Storage

- **Static brand/service images** stay in `public/assets/` and ship with the Vite/Vercel deploy. Do not copy them to Blob. Emails embed `public/assets/logo-header.png` via CID (fallback `GET /api/brand/logo`). Email HTML must not use emojis.
- **New uploads** (admin service photo, invoice PDF, etc.) go through `POST /api/admin/uploads` → Vercel Blob. Needs `BLOB_READ_WRITE_TOKEN` (create a Blob store, then `vercel env pull`).
- Keep `put()` inline in `api/index.ts` — no relative runtime Blob helper.

## Project Structure

### Client (Frontend)

- `client/pages/` — Route components
- `client/components/ui/` — Radix / shadcn UI library
- `client/App.tsx` — SPA routing
- `client/global.css` — Tailwind tokens
- `client/store/` — Redux slices (only place for API calls)

### Shared

- `shared/` — Types used by client (and `import type` in the API)
- `shared/api.ts` — Shared API interfaces

### Database

- `database/schema.sql` — source of truth for structure while coding
- `database/migrations/` — additive TiDB-compatible SQL

## Path Aliases

- `@/*` → `client/`
- `@shared/*` → `shared/`

Always use these aliases instead of relative imports.

## Styling Guidelines

- TailwindCSS 3 + tokens from `client/global.css` / `tailwind.config.ts`
- **Never** arbitrary palette classes (`text-emerald-500`, `bg-amber-400`, etc.)
- Use semantic tokens: `primary`, `accent`, `destructive`, `muted`, `secondary`, `foreground`, `background`, `border`, `card`, `input`, `ring`
- Prefer existing `client/components/ui/`; Lucide icons first, `react-icons` if needed

## State Management

**ALL data fetching in Redux slices via `createAsyncThunk` + axios. NEVER in components.**

```typescript
export const fetchData = createAsyncThunk("slice/fetchData", async (_, { getState }) => {
  const { data } = await axios.get("/api/endpoint");
  return data;
});

// component
dispatch(fetchData());
const { data, loading } = useAppSelector((s) => s.mySlice);
```

- Hooks: `useAppDispatch` / `useAppSelector` from `client/store/hooks.ts`
- Shared state belongs in the store, not component-local state

## Form Validation

- Formik + Yup; reusable schemas; submit via Redux thunks

## Component Guidelines

- Check `client/components/ui/` before creating new primitives
- Keep UI simple, cool, and engaging
