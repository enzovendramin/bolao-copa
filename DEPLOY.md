# Deployment Guide

## Production architecture

| Component | Service | Notes |
|---|---|---|
| Application | **Vercel** | Serverless functions pinned to a single region (`vercel.json`) |
| Database | **Neon** (managed PostgreSQL) | Pooled connection for the app, direct connection for migrations |
| Source | **GitHub** | Every push to a production branch triggers an automatic deploy |

Two independent instances run from this repository:

| Instance | Branch | Vercel region | Neon region | Key env vars |
|---|---|---|---|---|
| France | `main` | `fra1` (Frankfurt) | `eu-central-1` | `APP_TZ=Europe/Paris` (default) |
| Brazil | `brasil` | `gru1` (São Paulo) | `sa-east-1` | `APP_TZ=America/Sao_Paulo`, `OPEN_FROM_PHASE="Quartas de Final"` |

The `brasil` branch differs from `main` only in `vercel.json` (region). All other
behaviour is driven by environment variables, so both instances share the same code.

Co-locating functions and database in the same region brought typical page
latency down from ~2.2 s (default `iad1` → Frankfurt DB) to ~0.15–0.3 s.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Pooled Postgres URL (`?pgbouncer=true`) used by the app |
| `DIRECT_URL` | yes | Direct Postgres URL used by `prisma db push` |
| `AUTH_SECRET` | yes | JWT signing secret (`openssl rand -hex 32`) |
| `APP_TZ` | no | IANA time zone for display/input (default `Europe/Paris`) |
| `SCORE_EXACT` / `SCORE_OUTCOME` / `SCORE_CHAMPION` | no | Points per rule (defaults `5` / `2` / `10`) |
| `OPEN_FROM_PHASE` | no | First knockout phase where *every* match counts for the pool (default `Oitavas de Final`) |
| `NEXT_PUBLIC_ANALYTICS` | no | Set to `1` to enable Vercel Web Analytics |
| `EXPECTED_REGION` | scripts only | Safety lock for `scripts/seed-mata-mata.ts` — the script refuses to run unless the target DB host matches this region |

## First deployment

1. **Database** — create a Neon project, copy the pooled and direct connection strings.
2. **Schema & seed** — with `DATABASE_URL`/`DIRECT_URL` pointing to Neon:
   ```bash
   npx prisma db push
   npm run db:seed                       # edition + admin user
   npx tsx scripts/seed-copa-2026.ts     # group-stage fixtures (72 matches)
   ```
3. **Application** — import the GitHub repository in Vercel, set the environment
   variables above, and deploy. For a second instance, create another Vercel
   project on the same repo and set its production branch under
   *Settings → Environments → Production → Branch Tracking*.
4. **Post-deploy checklist**
   - Log in as the seeded admin and change the password immediately (🔑 in the header).
   - Do **not** run `scripts/seed-demo.ts` against production.
   - Enter results for any matches already played.

## Release process

- `git push` to a production branch → Vercel builds and swaps the deployment
  with no downtime; the database is untouched.
- Risky changes go to a feature branch first. Vercel creates an isolated
  preview URL for every branch; the live site is only affected on merge.
- Logic that touches scoring is covered by database-free tests
  (`scripts/test-rotina.ts`, `scripts/test-retro.ts`) and an end-to-end test
  (`scripts/test-logic.ts`, creates and removes its own data — run it against a
  dev database only).
- Rule changes on historical data are applied with `scripts/repontuar-tudo.ts`
  (idempotent full re-score) rather than manual SQL.
- Knockout fixtures are loaded with `scripts/seed-mata-mata.ts`, which is
  idempotent and refuses to run if the target database host does not match
  `EXPECTED_REGION` — this prevents writing the wrong instance's data.

## Security

- Passwords hashed with bcrypt; sessions are signed JWTs in an `httpOnly` / `SameSite` cookie (30 days).
- Login rate limiting (10 attempts per 15 min per IP + username).
- Security headers (`X-Frame-Options`, `nosniff`, `Referrer-Policy`) in `next.config.ts`.
- Every mutation re-checks authorisation on the server (Server Actions); the client is never trusted.
- The public page exposes only names and scores.

## Backup

Neon keeps point-in-time recovery history on the free plan (24 h). For an
additional copy: `pg_dump $DATABASE_URL > backup.sql`.
