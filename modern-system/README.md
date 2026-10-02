# Infant Vaccination Management System

A vaccination management system for tracking infant and maternal immunisation in
Ethiopia. This is a migration of the original PHP/MySQL application to
**NestJS + MongoDB (Mongoose)** with a **React + Vite** frontend.

## Documentation

| Document | For |
| --- | --- |
| **[USER-GUIDE.md](USER-GUIDE.md)** | **Clinic staff and administrators.** Step-by-step instructions for every role, plus known limitations. Start here. |
| [README.md](README.md) (this file) | Developers and operators. Installation, architecture, API reference, verification. |

## What changed during the migration

| Legacy PHP/MySQL | Modern system |
| --- | --- |
| `users` table, MD5 password hashes | `users` collection, argon2id hashes |
| `username` login | Login accepts **username or email** |
| `mother_table`, `child_table` | `mothers`, `children` collections |
| `mother_vaccin` (`tt1..tt5`, `rh` boolean flags) | `mothers.schedule` with due date, administration date, batch and status |
| `child_vaccine` (`r1..r5` boolean flags) | `children.schedule`, 15-dose schedule generated from the birth date |
| `post`, `post_img` | `posts` collection with categories and search |
| `health/process_vaccination.php` (empty file) | `POST /children/:id/vaccinations` |
| Roles `admin`, `registrar`, `health` | Roles `admin`, `registrar`, `doctor`, `parent` |
| MD5 migrated passwords | Transparently upgraded to argon2id on first login |

Legacy accounts keep working: an imported MD5 hash is stored in
`legacyPasswordHash` and is upgraded to argon2id the first time the password is
used successfully.

## Features

- Mother, child and user registration with role-based access control
- Automated vaccination schedules generated from the child's date of birth
- Tetanus toxoid (TT1–TT5) and Rh schedule for mothers
- Dose recording with batch number, administering clinician and clinic
- Digital vaccination card with printable output and progress tracking
- Doctor workflow: medical review, contraindication flagging, adverse
  reaction reporting and a review worklist
- Overdue tracking and due-soon cohorts
- Notification queue for due and overdue doses
- Clinic registry with geospatial lookup and vaccine inventory
- Public announcements feed with categories and search

## Technology stack

**Backend** — NestJS 11, TypeScript, Mongoose 9, Passport JWT, argon2id,
class-validator. **Frontend** — React 19, Vite 8, React Router 7, Tailwind,
Framer Motion, lucide-react.

## Running the system

### Option A — Docker (all services)

```bash
cd modern-system
cp .env.example .env
docker compose up -d
docker compose exec backend npm run seed
```

- Frontend: http://localhost:3000
- API: http://localhost:5000/api

### Option B — Local Node.js

You need a MongoDB instance. Either point `backend/.env` at an existing server,
or start one with `docker compose up -d mongodb`.

```bash
# Backend
cd backend
cp .env.example .env      # then edit if your Mongo is elsewhere
npm install
npm run seed              # creates demo accounts, a clinic, a mother and a child
npm run start:dev         # http://localhost:5000/api

# Frontend (separate terminal)
cd frontend
npm install
npm run dev               # http://localhost:3000
```

## Demo accounts

`npm run seed` creates one account per role. The shared password is
`Vaccinate@2024` (override with `SEED_PASSWORD`).

| Role | Username | Email |
| --- | --- | --- |
| admin | `admin` | admin@vaccination.et |
| registrar | `registrar` | registrar@vaccination.et |
| doctor | `doctor` | doctor@vaccination.et |
| parent | `parent` | parent@vaccination.et |

**The sign-in page has one-click demo buttons** for each role, so the
application can be demonstrated without typing credentials. Clicking a role
fills the username and password; you still press Sign In, which keeps the
validation and error handling visible rather than bypassing them.

### Demo data

The seed is idempotent and self-healing, so `npm run seed` can be re-run on an
existing database without duplicating anything:

- Clinic `CL000001`
- Mother `M00000001` (Selam Gebremariam), carrying a TT1–TT5 + Rh schedule
- Children `C00000001` (Dawit, 4 months) and `C00090002` (Selam, 11 months),
  both linked to the demo parent account and to the mother
- Partially completed dose histories with batch numbers, so coverage rings,
  dose timelines and "next dose" hints show real progress rather than a wall of
  pending doses

Doses that a clinician has already recorded are never overwritten: the
backfill only fills entries that are still `pending` with no `givenDate`.

To reset everything, drop the `vaccination` database and re-run `npm run seed`.

## API overview

All routes are prefixed with `/api`.

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, `PATCH /auth/change-password` |
| Users | `GET/POST /users`, `GET /users/search`, `GET/PATCH /users/profile`, `PATCH /users/:id`, `PATCH /users/:id/deactivate` |
| Mothers | `GET/POST /mothers`, `GET /mothers/due-for-vaccination`, `POST /mothers/:id/doses`, `DELETE /mothers/:id/doses/:vaccineName`, `POST /mothers/:id/link-child`, medical-history routes |
| Children | `GET/POST /children`, `GET /children/my-children`, `GET /children/due-for-vaccination`, `GET /children/:id/profile`, `POST /children/:id/vaccinations`, allergy and contraindication routes |
| Doctors | `GET /doctors/review-queue`, `GET /doctors/vaccination-safety/:childId`, `POST /doctors/medical-review`, contraindication and adverse-reaction routes |
| Clinics | `GET/POST /clinics`, `GET /clinics/search`, inventory and staff routes |
| Health | `GET /health/check`, `GET /health/stats`, `GET /health/due-cohorts`, `GET /health/refresh-overdue` |
| Notifications | `GET /notifications/due`, `POST /notifications/queue-due` |
| Posts | `GET /posts`, `GET /posts/categories`, admin/registrar write routes |

## Verification

```bash
cd backend
npm run db:check     # confirm the configured MongoDB is reachable
npm run type-check   # tsc --noEmit, no emit
npm run build        # swc emit into dist/
npm test             # unit tests
npm run test:smoke  # end-to-end against a running backend + completed seed
```

`npm run type-check` reads `tsconfig.build.json`, which is the same file set the
build emits. Spec files are excluded there but are still type-clean; check them
with `npx tsc --noEmit`.

`npm run build` uses SWC rather than `tsc` for emit. Decorator metadata makes
the TypeScript compiler resolve the type of every decorated member across the
whole dependency graph, which exhausts the heap on this project; SWC strips
types without resolving them, and `npm run type-check` still performs full type
checking separately.

`clinics.integration.spec.ts` needs `mongodb-memory-server`, which downloads a
MongoDB binary at test time. It is excluded from `npm test` because the download
requires network access; the same controller behaviour is covered by the smoke
test, which runs against a real database.

The smoke test covers dual-identifier login, access/refresh token separation,
role enforcement (including class-level `@Roles`), registration, schedule
generation, dose recording and duplicate-dose rejection, the contraindication
safety gate, parent data scoping and DTO validation. Run it against a non-default
port with `E2E_BASE_URL=http://localhost:5010/api`.

It reads the login password from `SEED_PASSWORD`, matching the seed script. If
the two disagree every login returns 401 and the whole suite cascades into
failure, so keep them in step.

## Rate limiting and lockout

Two independent mechanisms guard the auth endpoints:

- **Per-account lockout** — 5 consecutive failed logins locks the account for
  15 minutes. This is the primary brute-force defence (`AuthService`).
- **Per-IP rate limit** — 30 credential requests per 15 minutes per IP and
  route. The cap is deliberately not tighter because a health centre shares one
  NAT address across all its staff.

`GET /auth/me` runs on every page load to restore the session, so it is given a
much larger budget (600/hour) than the credential routes; otherwise ordinary
browsing would lock a user out of their own session.

## Vaccination safety gate

`POST /children/:id/vaccinations` refuses to record a dose while the child has
either an active contraindication or a history of a severe adverse reaction, in
either the dedicated collections or the embedded `medicalInfo` arrays. The
response names the blocker, and the dose can proceed once a doctor clears the
contraindication through `POST /doctors/contraindications/remove`.

## Notes on the migration

- `backend/.env` points at a MongoDB Atlas cluster (`mongodb+srv://`). To run
  entirely offline, switch `MONGODB_URI` to
  `mongodb://localhost:27017/vaccination` and run `docker compose up -d mongodb`.
  Nothing else changes; `npm run db:check` verifies whichever one is active.
- `npm run db:check` resolves the Atlas SRV records and reports the shard it
  reached. Atlas SRV hostnames have no A record, so an A-record lookup is not a
  valid liveness test.
- `@nestjs/swagger` is not installed because it requires NestJS 12 while this
  project is on 11. API documentation lives in this README instead.
- SMS and email providers are not wired up. `POST /notifications/queue-due`
  writes reminder records with a `pending` or `skipped` status rather than
  claiming to have sent a message.
- Rate limiting is in-memory, so counters reset when the process restarts.
- The Atlas cluster in `.env` is shared with other applications on that
  account. The `vaccination` database is separate and created on first write,
  so nothing outside it is touched — but the credentials are read/write on the
  whole cluster, so rotate them if that access is unwanted.
