# Office Meeting Room Booking System

Role-based meeting room booking app.

## Tech stack (mandatory)

- Backend: Node.js, Express, MySQL, Sequelize, JWT, **bcrypt**, express-validator, dotenv, morgan
- Frontend: React (Vite), React Router, Axios
- Database: MySQL (local)

## Project structure

```
office-meeting-room-booking/
├── backend/
└── frontend/
```

## Backend setup (local)

1. Create `backend/.env` from `backend/.env.example`.
2. Ensure MySQL is running locally and your credentials are correct in `.env`.
3. Install + run:

```bash
cd backend
npm install
npm start
```

- Backend runs on `http://localhost:5005`
- Sequelize will create tables automatically on first run.
- The database itself is created if missing (using `CREATE DATABASE IF NOT EXISTS`).

### Admin login

Set these in `backend/.env` (defaults in `.env.example`):

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

On server boot, an ADMIN user is auto-created if it doesn’t already exist.

## Frontend setup (local)

1. (Optional) Create `frontend/.env` from `frontend/.env.example`.
2. Install + run:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3005`

## Required API endpoints

- Auth
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Rooms
  - `GET /api/rooms`
  - `POST /api/rooms` (Admin)
  - `PUT /api/rooms/:id` (Admin)
  - `DELETE /api/rooms/:id` (Admin)
- Availability
  - `GET /api/rooms/:id/availability?start=&end=`
- Bookings
  - `POST /api/bookings` (Employee)
  - `GET /api/bookings/my` (Employee)
  - `DELETE /api/bookings/:id` (Employee)
  - `GET /api/bookings` (Admin)

## Overlap rule enforced

Booking fails if:

\[
\text{new\_start} < \text{existing\_end} \;\; \text{AND} \;\; \text{new\_end} > \text{existing\_start}
\]

