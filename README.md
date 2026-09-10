# DayTripper Kalpitiya

Local Tourist Day-Visit Planner and Information System (ITE2953 · M.H.M. Rahmy · E2410183)

A full-stack implementation of the DayTripper Kalpitiya web application built from
the approved SRS (see `SRS_DayTripper_Kalpitiya_E2410183.pdf`). Express + MongoDB
backend with a React public tourist portal and an administrator content-management
module, styled with glassmorphism.

## Setup

Full installation and run instructions (MongoDB, seeding, admin sign-in) live in
**[`SETUP.md`](./SETUP.md)**.

```bash
npm install                       # frontend deps
cd server && npm install && cd .. # backend deps
cd server && npm run seed && cd ..# first run: categories, 10 places, admin user
mongod --dbpath ./.mongo-data --port 27017 --bind_ip 127.0.0.1   # term 1
cd server && npm start                                            # term 2
npm run dev                                                       # term 3
```

Open http://localhost:5173 — the dev server proxies `/api` to `:5000`.

**Admin sign-in:** `admin` / `kalpitiya123` (override via `ADMIN_PASSWORD` in
`server/.env` before seeding).

## What's included

- **Public portal**: home/landing, catalogue with search + category/interest filters +
  sorting, place detail profiles (hours, distance, tips, dress code, photography notes),
  Leaflet/OSM map explorer with category pins and day-plan route, one-day itinerary
  planner (reorder, recommended order, travel-time estimates, schedule), favorites.
- **Admin module**: real server-backed login (`admin` / value of `ADMIN_PASSWORD` in
  `server/.env`, seeded default `kalpitiya123`), dashboard with place table, create/edit
  forms with server-side validation (25 km radius, lat/lng bounds, duration), soft-delete
  + restore bin, bulk category update, and category manager. All CRUD persists to MongoDB.

## Tech

- React 18 + Vite (frontend) · Express + Mongoose (backend)
- React Router · Leaflet / OpenStreetMap
- Vanilla CSS3 with glassmorphism treatment (no Tailwind)

## Routes

- `/` Home · `/catalogue` · `/place/:id` · `/map` · `/day-plan` · `/favorites`
- `/admin` login · `/admin/dashboard` admin CRUD

## API (port 5000)

- `GET  /api/health`
- `GET  /api/places` — list active places (query: `q`, `category`, `sort`)
- `GET  /api/places/:id` · `GET /api/places/categories` — single place / category counts
- Admin (session cookie required):
  - `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/session`
  - `GET /api/places/admin/all` — including soft-deleted
  - `POST /api/places` · `PUT /api/places/:id` · `PATCH /api/places/:id`
  - `DELETE /api/places/:id` (soft) · `POST /api/places/restore/:id` · `POST /api/places/bulk-update`
  - `GET/POST /api/categories` · `PUT/DELETE /api/categories/:id`

---

*Student academic project for ITE2953 — not an official government tourism portal.*