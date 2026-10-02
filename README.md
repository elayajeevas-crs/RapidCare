# RapidCare - Smart Emergency Response (prototype)

AI-assisted emergency support for **snake-bite** and **poisonous insect-sting** emergencies: classify the emergency, get location, rank nearby facilities by reported capability/antivenom status/distance, show guidance, notify a facility (prototype), and track status.

> **Safety:** RapidCare does not replace emergency medical professionals. Emergency guidance only. All seeded hospitals are **fictional DEMO DATA**. Notifications are a **prototype** (no real ambulance dispatch). Distances are straight-line (Haversine); no road travel times are estimated. First-aid text must be reviewed by a medical professional before real use.

## Prerequisites (Windows + VS Code)
Node.js 20+, Docker Desktop, Git.

## Setup
```
copy .env.example backend\.env
```
Edit `backend\.env` and set `JWT_SECRET` to a long random string.
```
docker compose up -d
cd backend
npm install
npx prisma migrate dev --name init --schema ../prisma/schema.prisma
npm run db:seed
npm run dev
```
Second terminal:
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 (API on :4000, proxied via `/api`).

## Demo accounts (seed; password from `DEMO_PASSWORD` env, default `Demo@12345`)
admin@rapidcare.demo (ADMIN) - patient@rapidcare.demo (PATIENT) - facility@rapidcare.demo (FACILITY, linked to the first demo hospital)

## Test the full flow
1. Home -> Start Emergency -> Snake Bite (or type "bitten by a snake" / use mic in Chrome).
2. Use my location (or enter lat/lon, e.g. 13.08, 80.27) -> ranked facilities + map.
3. Select & notify -> log in as facility@ in another browser -> Accept / Mark Ready; update antivenom status.
4. Log in as admin@ -> see the session, charts, edit resources, add/delete facilities.
5. Back in the patient tab: start route -> resolve. Share creates a 2-hour link.

## Tests
`cd backend && npm test` (API tests need the database running and seeded).

## API
Auth: `POST /api/auth/register|login`. Facilities: `GET /api/facilities`, `/nearby?lat&lon&type`, `/:id`; admin `POST/PUT/DELETE`; `PUT /:id/resources` (admin/facility). Emergency: `POST /api/emergency`, `GET/PUT /:id`, `POST /:id/select-facility`, `POST /:id/share`, `GET /shared/:token`. `POST /api/ai/classify-emergency`. `GET /api/notifications`, `PUT /api/notifications/:id`. `GET /api/admin/dashboard`.

## Environment variables
`DATABASE_URL`, `JWT_SECRET` (required); `FRONTEND_URL`, `BACKEND_URL`; `OPENAI_API_KEY`, `MAP_API_KEY` (optional - not yet wired; the app uses the local rule-based classifier and straight-line distance); `DEMO_PASSWORD` (seed only).

## Known limitations
No road routing/ETA, no LLM adapter yet, no offline caching, no analytics trends/profile page, no real notifications, emergency sessions are readable by id (cuid) without login. Not yet compiled or run by the author - expect to fix small errors on first run.

## Future scope
Ambulance and verified hospital APIs, SMS/WhatsApp alerts, regional-language voice, offline emergency packs, real-time capacity.
