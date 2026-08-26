# Clinic Business Software

A full-stack clinic / medical practice management application: patients, appointments,
doctors, medical records, and billing/invoicing, with role-based access for
administrators, doctors, and receptionists.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite (zero-config; swappable
  for Postgres), JWT authentication, Zod validation.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS v4, React Router, Axios, Recharts.

## Features

- **Auth & roles** — JWT login with three roles: `ADMIN`, `DOCTOR`, `RECEPTIONIST`.
  The first account ever created becomes the clinic administrator; all further staff
  accounts (including doctor profiles) are created by an admin from the Staff page.
- **Patients** — full CRUD, search, and a detail view with tabs for appointments,
  medical records, and invoices.
- **Appointments** — scheduling with doctor/date/status filters, double-booking
  prevention, and status transitions (scheduled → completed / cancelled / no-show).
- **Doctors** — staff directory with specialty, contact info, and consultation fee.
- **Medical records** — diagnosis, prescription, vitals, and notes, linkable to a
  specific appointment.
- **Billing** — multi-line-item invoices, partial/full payments, automatic status
  (unpaid/partial/paid), and outstanding-balance tracking.
- **Dashboard** — clinic-wide stats: patient/doctor counts, today's appointments,
  outstanding balance, revenue this month, appointment status breakdown, recent patients.

## Project structure

```
backend/     Express + Prisma API (REST, JSON)
frontend/    React SPA (Vite)
docker-compose.yml   optional local Postgres for production-like setups
```

## Getting started

Requires Node.js 18+.

```bash
# 1. Install dependencies for both apps
npm run install:all

# 2. Configure the backend environment
cp backend/.env.example backend/.env
# (defaults work out of the box — SQLite file database, no external services needed)

# 3. Create the database schema and seed demo data
npm run db:setup

# 4. Run both apps in dev mode
npm run dev
```

- Backend API: http://localhost:4000 (proxied at `/api` from the frontend dev server)
- Frontend: http://localhost:5173

### Demo accounts (seeded, password for all: `password123`)

| Role         | Email                     |
|--------------|---------------------------|
| Admin        | admin@clinic.test         |
| Receptionist | reception@clinic.test     |
| Doctor       | maria.chen@clinic.test    |
| Doctor       | james.okafor@clinic.test  |

## Running the apps individually

```bash
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
```

Useful backend scripts (run from `backend/`, or via `npm run <script> --workspace backend`):

```bash
npm run prisma:studio   # browse the database in Prisma Studio
npm run prisma:migrate  # create/apply a new migration after editing schema.prisma
npm run seed             # re-run the demo data seed (skips if data already exists)
npm run build && npm start   # production build/run
```

## Switching to Postgres

The backend defaults to SQLite for zero-config local development. To use Postgres
(e.g. for production):

1. Start a local Postgres with `docker compose up -d` (or point at any Postgres instance).
2. In `backend/prisma/schema.prisma`, change the datasource `provider` to `"postgresql"`.
3. In `backend/.env`, set `DATABASE_URL="postgresql://clinic:clinic@localhost:5432/clinic?schema=public"`.
4. Run `npm run prisma:migrate --workspace backend` to apply the schema.

Note: the schema stores enumerated fields (roles, statuses, gender) as plain strings
because SQLite has no native enum type — see `backend/src/types/enums.ts` for the
canonical value lists. If you move to Postgres you can optionally convert these back
to native Prisma `enum` types.

## API overview

All endpoints are under `/api` and (except `/api/auth/*` and `/api/health`) require an
`Authorization: Bearer <token>` header.

| Resource         | Endpoints |
|------------------|-----------|
| Auth             | `POST /auth/register` (first user only), `POST /auth/login`, `GET /auth/me` |
| Staff (admin)    | `GET/POST /users`, `PATCH/DELETE /users/:id` |
| Doctors          | `GET /doctors`, `GET/PATCH /doctors/:id`, `GET /doctors/:id/availability` |
| Patients         | `GET/POST /patients`, `GET/PATCH/DELETE /patients/:id` |
| Appointments     | `GET/POST /appointments`, `GET/PATCH/DELETE /appointments/:id` |
| Medical records  | `GET/POST /medical-records`, `GET/PATCH/DELETE /medical-records/:id` |
| Invoices         | `GET/POST /invoices`, `GET/PATCH/DELETE /invoices/:id`, `POST /invoices/:id/payments` |
| Dashboard        | `GET /dashboard/summary` |

## License

Provided as-is for internal/demo use.
