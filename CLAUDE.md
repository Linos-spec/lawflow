# Linos Legal — engineering guide

AI-powered legal practice-management app. The **legal module of the Linoscore suite**, live at **https://legal.linoscore.com**. Branded **"Linos Legal"** — slogan *"The AI employee every lawyer wishes they had."*

## Stack
- **Next.js 15** (App Router, RSC) + React 19, TypeScript. Styling is inline styles + a small utility layer in `src/app/globals.css` (no Tailwind components; there is a `@import "tailwindcss"` for resets/tokens).
- **Prisma** + **PostgreSQL**. **Schema is applied with `prisma db push`, NOT migrations** — there are no migration files. `start.sh` runs `db push` on boot, so additive schema changes are safe to deploy.
- **NextAuth (Auth.js)** credentials auth, JWT sessions, `trustHost: true`.
- **AI**: Vercel AI SDK (`ai`) + `@ai-sdk/openai`, model `gpt-4o-mini`. All AI is best-effort and returns null/[] without `OPENAI_API_KEY` — never hard-depend on it.

## Deploy
- GitHub **`Linos-spec/lawflow`**, branch **`main`**, **deploy-on-push** → DigitalOcean App Platform app `lawflow` (id `964f8e2d-d26d-419b-9d1f-7da5d78f500d`). Spec in `.do/app.yaml`.
- Domain `legal.linoscore.com`; **DNS is managed in Netlify** (team `unair2012`), not DigitalOcean.
- Push to `main` = production deploy. Docker build ~5–8 min. Verify a deploy via `doctl apps get <id>` and curling the route.

## Local dev
```bash
docker start lawflow-pg   # Postgres on :5433 (see .env.local DATABASE_URL)
npm install && npx prisma generate
npm run dev               # Next dev
```
- Env in `.env.local` (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`).
- After editing `prisma/schema.prisma`: `npx prisma db push --skip-generate && npx prisma generate`.
- Test login (local DB only): reset a user's `hashedPassword` with bcryptjs; there is no seed file.

## Architecture & conventions
- **Multi-tenancy:** `Organization` → `Firm` → everything. Every query is firm-scoped. Get context with `getOrgFirmIds()` from `src/lib/auth-guard` (returns `{ userId, organizationId, firmId, role }`); guard with `unauthorizedResponse()` / `forbiddenResponse()`.
- **API shape:** route handlers under `src/app/api/v1/...` return `successResponse(data)` / `errorResponse(msg, status)` / `paginatedResponse(...)` from `src/lib/api/response`. Validate bodies with Zod (`src/lib/validators`).
- **Design tokens** live in `src/app/globals.css` `:root` — suite palette: brand blue `#1d4ed8` (`--brand`), amber accent `#f59e0b` (`--gold`), slate neutrals, **Inter**. Reusable classes: `lf-card`, `lf-btn` / `lf-btn-gold` / `lf-btn-primary`, `lf-badge-*`. Reuse these; don't hardcode brand hex.
- **ESLint blocks unescaped apostrophes in JSX** (`react/no-unescaped-entities`) — write `&apos;`. This fails the prod build, so check `npm run build` before pushing.
- `pdf-parse` must stay in `serverExternalPackages` (next.config.ts) or it breaks bundling.
- Prisma `Bytes` fields want `Uint8Array<ArrayBuffer>` — see `src/lib/storage.ts`.

## What's built (all live)
- **AI Client Intake** — public conversational intake → `Lead`; automated conflict check (`src/lib/conflict-check.ts`); AI qualification with a **retainer recommendation** (`src/lib/lead-qualification.ts`); convert → `orchestrateConversion` (`src/lib/orchestrator.ts`) opens the matter, drafts a deadline plan, and **auto-drafts an engagement letter** (`src/lib/engagement-letter.ts`).
- **Document Intelligence** — upload → OCR/extract (`document-extract.ts`, `pdf-parse` + OpenAI vision), AI tag/organize, versioning, full-text search, smart folders. Storage is pluggable (`src/lib/storage.ts`, Postgres-backed MVP → DO Spaces later).
- **Customer 360** — `/clients/[clientId]` aggregates cases, docs, billing, deadlines, time, intake.
- **AI Employee mode** — opt-in workspace gated on `Firm.aiModeEnabled` (admin toggle in Settings). Automation flags: `aiAutoCreateMatter`, `aiAutoGenerateTasks`, `aiAutoEngagementLetter`.
- **AI Case Intelligence** — `/cases/[id]` panel (AI mode): summary, strength/risk scores, timeline, missing evidence, defenses, next steps, recommended docs, statutes/case law, prior matters, tasks. Cached on `Case.aiAnalysis`.
- **Delivery module** — links to **Linoscore Delivery** courier (repo `Linos-spec/linoscore-delivery`, live API `https://api.linoscore.com`, JWT auth, string enums). Per-firm connection in Settings; "Send via Linoscore Delivery" on a matter; polls status; pulls the custody certificate back as a proof Document. Client: `src/lib/delivery-client.ts`.

## Guardrails (legal domain — do not soften)
- AI outputs are **advisory**; nothing leaves the firm without attorney review. Retainer/qualification are suggestions, not decisions.
- AI-suggested **statutes and case law are labeled "verify before relying"** — LLMs hallucinate citations (sanctions risk). Never present them as authoritative.
- A lead with an unresolved **conflict cannot convert** until an attorney waives it.
- **Creating a Linoscore Delivery dispatches a real courier — never do it as a test.**
