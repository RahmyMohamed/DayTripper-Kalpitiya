# Setup Guide — DayTripper Kalpitiya

Install and run the full-stack app (React + Vite frontend, Express + MongoDB backend).
If you received this as a ZIP, unpack it first and follow the steps below from the
project root.

## 1. Prerequisites

- **Node.js 18+** (tested on 22.x) and **npm**
- **MongoDB 7+** running locally on `127.0.0.1:27017`

### MongoDB options

**A. MongoDB Community Server (recommended, easy on macOS/Windows/Ubuntu)** — install
from <https://www.mongodb.com/docs/manual/installation/>, then start it:

```bash
mongod --dbpath ./.mongo-data --port 27017 --bind_ip 127.0.0.1
```

**B. Docker** — as long as you have Docker available:

```bash
mkdir -p .mongo-data
docker run -d --name dt-mongo -p 127.0.0.1:27017:27017 \
  -v "$(pwd)/.mongo-data:/data/db" mongo:7
```

Verify it is up:

```bash
mongosh --port 27017 --eval "db.runCommand({ ping: 1 })"
```

## 2. Install dependencies

```bash
# frontend
npm install

# backend
cd server
npm install
cd ..
```

> `server/.env` is never shipped (it's git-ignored). Create it from the template to
> override the defaults — all values have safe fallbacks, so this step is optional:

```bash
cd server
cp .env.example .env
cd ..
```

## 3. Seed the database (first run only)

Loads the 12 categories, the 10 SRS attractions, and the admin user.

```bash
cd server
npm run seed
cd ..
```

## 4. Run the app

Three processes are required. Run each in its own terminal.

**Terminal 1 — MongoDB** (`127.0.0.1:27017`):

```bash
mongod --dbpath ./.mongo-data --port 27017 --bind_ip 127.0.0.1
```

**Terminal 2 — API server** (`http://localhost:5001`):

```bash
cd server
npm start
```

**Terminal 3 — Frontend dev server** (`http://localhost:5173`):

```bash
npm run dev
```

Open **http://localhost:5173**.

## 5. Sign in as administrator

| Field    | Value (default) |
| -------- | --------------- |
| Username | `admin`         |
| Password | `kalpitiya123`  |

Override the password by setting `ADMIN_PASSWORD` in `server/.env` **before** running
`npm run seed`. Sign in at `/admin` and manage places, bin, bulk updates, and
categories from `/admin/dashboard`.

## 6. Reset / re-seed

The seeder upserts by name, so it's safe to re-run at any time — it restores the
original 10 places and admin account without wiping your edits to other records.

To start completely fresh:

```bash
rm -rf .mongo-data     # stop mongod first
mkdir -p .mongo-data
# then re-run seed from step 3
```

---

### Ports & config summary

| Service   | Port  | Config (server/.env)             |
| --------- | ----- | -------------------------------- |
| MongoDB   | 27017 | `MONGODB_URI`                    |
| API       | 5001  | `PORT`, `SESSION_SECRET`         |
| Frontend  | 5173  | `CLIENT_ORIGIN` (CORS for API)   |

The Vite dev server proxies `/api` → `http://localhost:5001`, so the frontend needs
no extra configuration in development.