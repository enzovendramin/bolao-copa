# 🏆 World Cup 2026 Prediction Pool

Private prediction-pool web app built for the 2026 FIFA World Cup and run live
for **32 participants** across **two independent production instances**
(France and Brazil) from a single codebase.

**Stack:** Next.js 15 (App Router, Server Components + Server Actions) · React 19 ·
TypeScript · Tailwind CSS 4 · Prisma 6 · PostgreSQL (Neon) · Vercel

The UI is in Brazilian Portuguese, the participants' language. The original
Portuguese documentation is kept in [docs/README.pt-BR.md](docs/README.pt-BR.md).

## Highlights

- **One codebase, two deployments.** Time zone, scoring rules, knockout-phase
  eligibility and analytics are all driven by environment variables; the two
  production branches differ only in their Vercel region (see [DEPLOY.md](DEPLOY.md)).
- **~85% latency reduction** (2.2 s → 0.3 s per page) by pinning serverless
  functions to the same region as the database and using pooled Postgres connections.
- **13 production releases during the live tournament, zero downtime**, using
  per-branch preview deployments, database-free tests on the scoring engine and
  idempotent, region-locked data scripts.
- **Custom auth and admin back-office**: JWT cookie sessions, bcrypt, login rate
  limiting, security headers; user approval, fixtures, results and full re-scoring.
- **Deterministic scoring/ranking engine** with a cascading tie-break and points
  materialised at result entry, so every read (ranking, podium, history) is a plain query.

## Run locally

```bash
npm install
cp .env.example .env                 # set DATABASE_URL, DIRECT_URL, AUTH_SECRET
npx prisma db push
npm run db:seed                      # edition + admin user (admin / admin123)
npx tsx scripts/seed-copa-2026.ts    # 72 group-stage fixtures
npm run dev                          # http://localhost:3000
```

Times are stored in UTC and displayed/entered in `APP_TZ` (default `Europe/Paris`).

## Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | One project for frontend and backend; Server Actions replace a separate REST API, so there is a single artefact to build and deploy. |
| Language | TypeScript | Type safety on scoring rules and form handling. |
| Styling | Tailwind CSS 4 | Consistent design without a heavy component library; ~100 kB of client JS in total. |
| Database | PostgreSQL (Neon) via Prisma | Managed Postgres with a pooled connection for the app and a direct one for migrations. SQLite was used only for the initial prototype. |
| Auth | Own JWT cookie (`jose` + `bcryptjs`) | No external provider, no e-mail flow. Username + password; forgotten passwords are reset by the admin. `httpOnly` + `SameSite=Lax`. |
| Flags | Images (flagcdn.com) | Flag emojis do not render on Windows; images look identical everywhere. |

### Design decisions

1. **Match status is derived, never stored.**
   `OPEN` (before kickoff) → `CLOSED` (after kickoff) → `FINISHED` (official score entered).
   Predictions lock exactly at kickoff without any cron job, queue or admin
   action: every read and write simply compares `now >= kickoff`. Fewer moving
   parts, fewer bugs.

2. **Predictions open in waves.**
   Each match opens for predictions 7 days before kickoff so the predictions
   screen never shows the whole tournament at once. The admin can force a match
   open or closed.

3. **Server Actions instead of a REST API.**
   Every form (login, predictions, admin) posts straight to a server function.
   Authorisation (`requireApprovedUser`, `requireAdmin`) is re-checked on the
   server for every mutation; the client is never trusted. Predictions for
   matches that have already started are ignored even if the form is forged.

4. **Points are computed and materialised when a result is entered.**
   Rules (defaults, configurable via `SCORE_EXACT` / `SCORE_OUTCOME` / `SCORE_CHAMPION`):
   exact score **5**, correct outcome **2**, miss **0**, plus a **champion pick**
   worth **10** credited when the admin sets the champion. Saving an official
   score (a) scores and stores every prediction for that match, (b) recomputes
   per-participant totals, (c) reassigns positions while keeping the previous
   one for the ⬆ ⬇ ➖ trend. Reads stay trivial.

5. **Cascading tie-break; full ties share a position.**
   Order: points → exact scores → correct outcomes. Participants tied on
   everything share the position (`1st, 1st, 3rd` — competition ranking).

6. **Champion pick locks itself.**
   Editable during the group stage, locked automatically at the kickoff of the
   first knockout match. The admin can override the lock either way.

7. **Which matches count is a per-instance rule.**
   In the group stage only matches involving one of the pool's six teams
   (🇧🇷 🇦🇷 🇫🇷 🇪🇸 🇩🇪 🇵🇹) count. From the phase set in `OPEN_FROM_PHASE`
   (default: round of 16) every knockout match counts. All other fixtures are
   still listed in the schedule (by day or as a bracket) without predictions.

8. **Prediction visibility is enforced server-side.**
   Participants only see other people's predictions on pages that filter
   `kickoff <= now`. The admin has a separate view of everything.

9. **Multiple editions from day one.**
   `Edition` ↔ `Participation` ↔ `Match` scope everything by edition. Running a
   2030 pool means inserting one row and activating it.

10. **Knockout matches: regular time + extra time only.**
    Penalty shoot-outs are not modelled; a draw stays a draw for scoring.

### Data model

```
User (name, username, password hash, role: ADMIN|PARTICIPANT, status: PENDING|APPROVED)
 └─ Participation (per edition: points, exact, outcomes, position, previous position, champion pick)
 └─ Prediction (goals A/B + materialised points; unique per user + match)
 └─ Feedback (per edition: what worked, what to improve)
Edition (World Cup 2026, active; champion team; champion-pick lock override)
 └─ Match (team A/B as ISO codes, kickoff in UTC, phase, official score nullable, prediction override)
```

### Routes

```
/                  Public page (no login): podium, ranking, results
/entrar /cadastro  Sign in / sign up
/aguardando        Account created, awaiting admin approval
/inicio            Next match · pending predictions · podium · ranking summary
/palpites          All open matches, one "save all" button
/ranking           Podium + full table (position, name, points, exact, outcomes, trend)
/historico         Finished matches: result, your prediction, points, everyone's predictions
/agenda            Every fixture, by day or by phase (bracket)
/retrospectiva     End-of-tournament awards and statistics
/cerimonia         Podium with progressive reveal
/feedback          Participant feedback form
/senha             Change own password
/admin             Approve/reject/remove participants, reset passwords
/admin/jogos       Create/edit/delete fixtures, force predictions open/closed
/admin/resultados  Enter official scores and the champion (recomputes everything)
/admin/palpites    Everyone's predictions
/admin/feedback    Feedback received
```

**Participant flow:** sign up → wait for approval → enter scores on the
predictions screen (large inputs, numeric keyboard, one save button) → follow the
podium and ranking.

**Admin flow:** approve requests → register fixtures → enter each result → scores,
ranking and trend are recomputed immediately.

### Security

- bcrypt password hashing; signed JWT session in an `httpOnly` cookie.
- Middleware blocks private routes without a session; layouts check approval and admin role against the database.
- Every mutation re-validates permissions on the server; the public page exposes only names and scores.
- Login rate limiting and HTTP security headers.
- Forgotten password: the admin issues a temporary one from the back-office.

## Tests

- `npx tsx scripts/test-rotina.ts` — time zones, prediction window, locks (in memory, no database).
- `npx tsx scripts/test-retro.ts` — retrospective awards and statistics (pure functions).
- `npx tsx scripts/test-logic.ts` — scoring, tie-break and position trend end to end (creates and removes its own data; **development database only**).

## Deployment

See [DEPLOY.md](DEPLOY.md): Vercel + Neon, the two-instance setup, environment
variables and the release process.
