# Roomify – Office Meeting Room Booking System

Roomify is a full‑stack web application for managing office meeting rooms. It supports role‑based access, smart availability rules, and real‑world workflows like room blocking and meeting check‑ins.

> Tech stack: **Node.js + Express + MySQL (Sequelize)** on the backend, **React + Vite** on the frontend.

---

## Features

- **Role‑based access**
  - **Employee**
    - Register & login
    - Browse and book rooms
    - Slot‑based time selection (30‑min / 1‑hour, etc.)
    - View & cancel own bookings
    - Check in to meetings within a time window
    - Personal analytics dashboard
  - **Admin**
    - Login with seeded credentials
    - Create, edit, delete rooms
    - Block / unblock rooms for maintenance
    - Configure office‑wide booking rules
    - View all bookings and usage analytics

- **Smart booking rules**
  - Office working hours (e.g. 9:00–18:00)
  - Maximum booking duration
  - Slot size (e.g. 30 minutes)
  - All enforced in backend and surfaced in the UI with clear error messages

- **Conflict‑free scheduling**
  - Prevents overlapping bookings for the same room
  - Prevents bookings for blocked rooms
  - Capacity‑aware bookings (attendees cannot exceed room capacity)

- **Attendance tracking**
  - Employees can **check in** to a booking from 15 minutes before start up to 30 minutes after
  - Check‑in timestamps stored per booking
  - Admin stats can be used to measure attendance vs. no‑shows

- **Modern UI**
  - Editorial‑style layout inspired by ticketing/event sites
  - Smooth page transitions
  - Landing page, employee dashboard, and admin dashboard

---

## Project Structure

```text
office-meeting-room-booking/
├─ backend/            # Express API + Sequelize models
├─ frontend/           # React + Vite SPA (Roomify UI)
├─ docker-compose.yml  # Optional infra (MySQL, etc.)
└─ .github/workflows/  # CI/CD configuration
```

### Backend (backend/)

Key files:

- `backend/.env`
  - `PORT=5005`
  - `NODE_ENV=development`
  - `JWT_SECRET`, `JWT_EXPIRE`
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - Seeded admin:
    - `ADMIN_NAME=Office Admin`
    - `ADMIN_EMAIL=aj17cit@gmail.com`
    - `ADMIN_PASSWORD=Arjun@aj17`

- `src/config/database.js`
  - Ensures the MySQL database exists and initializes a shared `Sequelize` instance.

- `src/models/`
  - `User` – employees and admins (`EMPLOYEE` / `ADMIN` roles)
  - `Room` – meeting rooms with `capacity`, `floor`, `status` (`AVAILABLE` / `BLOCKED`)
  - `Booking` – reservations (`start_time`, `end_time`, `attendees`, `status`, `checked_in_at`)
  - `BookingRule` – global rules (working hours, max duration, slot size)
  - `index.js` – wires models, associations, and exports `{ sequelize, User, Room, Booking, BookingRule }`.

- `src/middlewares/`
  - `authMiddleware` – verifies JWT and attaches `req.user`.
  - `roleMiddleware` – checks allowed roles, returns 403 if unauthorized.
  - `errorMiddleware` – 404 and error handler.

- `src/controllers/`
  - `authController`
    - `register` – create an EMPLOYEE user, hash password, return JWT.
    - `login` – email/password auth, return JWT.
  - `roomController`
    - CRUD for rooms.
    - `getAvailability` – checks:
      - Room exists & not blocked
      - Times within working hours
      - Duration <= max booking minutes
      - Times aligned to slot size
      - No overlapping bookings
  - `bookingController`
    - `createBooking` – conflict‑free, capacity‑aware booking creation.
    - `getMyBookings`, `cancelBooking`.
    - `checkInBooking` – meeting check‑in within allowed window.
    - `getAllBookings`, `getStats` – global booking and analytics for admins.
  - `ruleController`
    - `getRules`, `updateRules` – manage office booking rules.

- `src/routes/`
  - `/api/auth`
    - `POST /register`
    - `POST /login`
  - `/api/rooms`
    - `GET /` – list rooms (any logged‑in user)
    - `POST /` – create room (ADMIN)
    - `PUT /:id` – update room (ADMIN)
    - `DELETE /:id` – delete room (ADMIN)
    - `GET /:id/availability` – availability check with rule enforcement
  - `/api/bookings`
    - `POST /` – create booking (EMPLOYEE)
    - `GET /my` – current user’s bookings (EMPLOYEE)
    - `DELETE /:id` – cancel (EMPLOYEE)
    - `POST /:id/checkin` – check in to a meeting (EMPLOYEE)
    - `GET /` – list all bookings (ADMIN)
    - `GET /stats` – analytics (ADMIN)
  - `/api/rules`
    - `GET /` – read booking rules (any logged‑in user)
    - `PUT /` – update booking rules (ADMIN)

- `src/app.js`
  - Configures middleware and mounts all routes.

- `src/server.js`
  - Bootstraps database and models.
  - Runs `sequelize.sync({ alter: NODE_ENV !== "production" })` for local dev.
  - Seeds:
    - Admin user (from `.env`)
    - `BookingRule` defaults (9:00–18:00, 120‑min max, 30‑min slots).

---

### Frontend (frontend/)

Key files:

- `frontend/.env`
  - `VITE_API_URL=http://localhost:5005/api`

- `src/main.jsx`
  - Mounts the React app with `BrowserRouter`.

- `src/index.css`
  - Global styles for the editorial Roomify UI:
    - Beige background, dark text, thin borders
    - Reusable layout primitives: `.container`, `.card`, `.panel`, `.grid-*`
    - Typography: `.display`, `.kicker`, `.subhead`
    - Smooth route transitions via `.page { animation: pageIn }`

- `src/services/api.js`
  - Axios client configured with `VITE_API_URL`.
  - Attaches JWT from `localStorage` on each request.
  - Helper functions: `setAuth`, `clearAuth`, `getUser`.

- `src/components/Navbar.jsx`
  - Top navigation bar:
    - Brand: **Roomify**
    - Logged‑out: `Home`, `Login`, `Register`
    - Employee: `Dashboard`, `Rooms`, `My bookings`, email, `Logout`
    - Admin: `Admin dashboard`, `Rooms`, email, `Logout`

- `src/App.jsx`
  - Route guards:
    - `RequireAuth` – redirects to `/login` if not authenticated.
    - `RequireRole` – restricts to EMPLOYEE or ADMIN.
  - Routes:
    - `/` → `Landing`
    - `/login` → `Login`
    - `/register` → `Register`
    - `/dashboard` → `EmployeeDashboard` (EMPLOYEE)
    - `/rooms` → `Rooms` (any logged‑in user)
    - `/rooms/:id/book` → `BookRoom` (EMPLOYEE)
    - `/my-bookings` → `MyBookings` (EMPLOYEE)
    - `/admin` → `AdminDashboard` (ADMIN)
    - `*` → redirect to `/`

#### Landing Page (`src/pages/Landing.jsx`)

Landing hero inspired by ticketing/event sites:

- Kicker: **Roomify**
- Display heading: **Meeting rooms**
- Subtext explaining the value.
- Prominent actions:
  - Login / Register (for visitors)
  - Go to Dashboard / Browse rooms (for signed‑in users).
- Highlight panels describing:
  - Rooms management
  - Booking rules
  - Analytics
- Media strip with a single hero illustration.

#### Authentication

- `Login.jsx`
  - Email + password.
  - Button to prefill admin email (for quick admin login).
  - On success:
    - ADMIN → `/admin`
    - EMPLOYEE → `/dashboard`

- `Register.jsx`
  - Name, email, password.
  - Immediately logs new user in as EMPLOYEE and redirects to `/dashboard`.

#### Employee Experience

- `EmployeeDashboard.jsx`
  - Summary metrics:
    - Upcoming bookings
    - Total booked
    - Cancelled
    - Approx hours booked
  - Panels:
    - Next meeting (room, time, attendees)
    - Favorite room (most frequently booked)
    - Rooms snapshot (number of rooms, available vs blocked)

- `Rooms.jsx`
  - Searchable rooms list with:
    - ID, name, capacity, floor, status
    - `Book` link for employees
  - Quick availability checker:
    - Room selector
    - Start datetime (snaps to slot size)
    - Duration selector (slot increments, up to rule max)
    - Shows:
      - Available / Not available
      - Reason (blocked, outside working hours, max duration exceeded, misaligned to slot)
      - Number of conflicts, if any.

- `BookRoom.jsx`
  - Shows selected room details (name, floor, capacity).
  - Slot‑aware booking form:
    - Start (snaps to slot)
    - Duration (e.g. 30 min, 1 hr, etc.)
    - End (auto‑computed and read‑only)
    - Attendees:
      - Limited by room capacity
      - Shows “Capacity N • Seats left X”
  - Workflow:
    1. `Check availability` → `/rooms/:id/availability`
    2. If available, `Book` → `/bookings`

- `MyBookings.jsx`
  - Table of current user’s bookings:
    - Room, attendees, times, status
    - Check‑in status and time
  - Actions:
    - **Check in** (for active bookings, within time window)
    - **Cancel** (for booked meetings)

#### Admin Experience

- `AdminDashboard.jsx`
  - **Rooms tab**
    - Create/edit/delete rooms.
    - Block/unblock status (for maintenance or special use).
  - **Bookings tab**
    - View all bookings, with employee and room info.
  - **Stats tab**
    - Bookings per day.
    - Bookings per room.
    - Backed by `/api/bookings/stats` (includes total + checked‑in counts).
  - **Rules tab**
    - Manage:
      - Work start / end (minutes from midnight)
      - Max booking length (minutes)
      - Slot size (minutes)
    - Saves to `/api/rules` and immediately affects validation and availability.

---

## Running the Project

### Prerequisites

- Node.js (LTS)
- MySQL (local or via Docker)

### 1. Backend

```bash
cd backend
cp .env.example .env   # if you have an example file; otherwise edit .env directly
# configure DB_*, JWT_*, and ADMIN_* values

npm install
npm start
```

On first run:

- Ensures the database exists.
- Runs Sequelize sync (with `alter` in development).
- Seeds:
  - Admin user (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
  - Default booking rules.

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # ensure VITE_API_URL is set, or edit .env directly
npm install
npm run dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

### 3. Logging In

- **Admin**
  - Email: `aj17cit@gmail.com`
  - Password: `Arjun@aj17`
  - Can manage rooms, booking rules, and view analytics.

- **Employee**
  - Register via the **Register** page.
  - Once logged in, you’ll land on the **Employee dashboard**.

---

## Demo Script (Suggested)

1. **Landing & branding**
   - Show the **Roomify** landing page.
   - Explain the value: conflict‑free, policy‑aware room booking.

2. **Employee flow**
   - Register a new employee, land on dashboard.
   - Go to **Rooms**:
     - Use quick availability check for a slot.
     - Click **Book** and complete a booking.
   - Go to **My bookings**:
     - Show the new booking.
     - Demonstrate **Check in** (if inside time window).
     - Optionally **Cancel** the booking.

3. **Admin flow**
   - Login as admin (seeded credentials).
   - In **Rooms** tab:
     - Create a new room or block an existing one.
   - In **Rules** tab:
     - Adjust working hours or slot size.
   - In **Stats** tab:
     - Show bookings per day and per room.

4. **Policy enforcement**
   - Try to book:
     - Outside working hours.
     - Longer than max duration.
     - With times not aligned to slot size.
   - Show clear error messages and how rules keep bookings consistent.

---

## Future Improvements

- Visual charts for admin stats (with a small chart library).
- Detailed no‑show reports based on `checked_in_at`.
- Richer rule configuration (per‑room rules, blackout days).
- Calendar or timeline view of bookings.

Roomify is already a complete, realistic meeting‑room system, but it’s designed so you can extend it easily as your requirements grow.

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

