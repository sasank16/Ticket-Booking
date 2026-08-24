# ??? SeatSwift ? Next-Gen Ticket Booking & Concurrency Engine

A high-performance ticket booking platform for movies and concerts featuring interactive visual seat maps, TTL-based seat hold auto-release, concurrency locking, FIFO waitlist reallocation on cancellations, role-based authentication, and QR code tickets.

---

## ?? Key Highlights & Architecture

- **Visual Seat Map**: Interactive grid with row/col coordinates, tier pricing (VIP / Premium / Standard), and live screen curvature.
- **Seat Hold TTL & Auto-Release**: Configurable 10-minute hold window with digital countdown timer and background auto-release worker.
- **Concurrency Protection**: Atomic database transactions preventing simultaneous hold attempts for the exact same seat.
- **Automated Waitlist Engine**: First-come-first-served (FIFO) seat reallocation upon ticket cancellation with time-limited claim tokens and notification emails.
- **Real-Time Live Sync**: WebSocket gateway broadcasting instant seat status changes (`AVAILABLE`, `HELD`, `BOOKED`) to all connected users.
- **QR Code Ticketing**: Generates cryptographically verifiable QR codes delivered via email.
- **Role-Based Access Control (RBAC)**:
  - **Customer**: Browse events, interactive seat selection, hold timer, QR ticket wallet, cancellation.
  - **Organiser**: Create events, schedule showtimes, configure tier pricing, view live revenue & occupancy metrics.
  - **Admin**: Create venues, customize row/col layouts and category mappings.

---

## ??? Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite (local) / PostgreSQL (production), Socket.IO, Nodemailer, QRCode, Zod.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.

---

## ?? Quickstart Guide

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Backend Setup
```bash
cd backend
npm install
npm run prisma:push
npm run prisma:seed
npm run dev
```
Backend API will start on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App will start on `http://localhost:5173`.

---

## ?? Automated Concurrency Test

Run the simulated race-condition test where 10 users attempt to hold the exact same seat at the exact same millisecond:
```bash
cd backend
npm run test:concurrency
```
**Expected Output**:
```
RESULTS:
  ? Successful Holds: 1
  ? Rejected Conflicts: 9
?? CONCURRENCY PROTECTION PASSED: Exactly 1 customer won the hold lock, 9 were prevented from double-booking!
```

---

## ?? Pre-Seeded Demo Accounts (Password: `password123`)

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Customer** | `customer@seatswift.com` | Browse, Hold Seats, Checkout, View QR, Cancel |
| **Organiser** | `organiser@seatswift.com` | View Analytics Dashboard, Sales & Occupancy |
| **Admin** | `admin@seatswift.com` | Manage Venues & Seat Layout Builder |

---

## ?? API Reference Summary

### Authentication
- `POST /api/auth/register` ? Register a new user (`CUSTOMER`, `ORGANISER`, `ADMIN`)
- `POST /api/auth/login` ? Login and receive JWT bearer token
- `GET /api/auth/me` ? Get current user profile

### Events & Showtimes
- `GET /api/events` ? List events with filters (`category`, `city`, `search`)
- `GET /api/events/:id` ? Get event details with venue & showtimes
- `POST /api/events` ? Create event (`ORGANISER` / `ADMIN`)
- `GET /api/showtimes/:id/seats` ? Get live seat map with real-time hold statuses
- `POST /api/showtimes` ? Create showtime with category pricing (`ORGANISER` / `ADMIN`)

### Seat Hold & Booking
- `POST /api/seats/hold` ? Atomically hold selected seats with 10-minute TTL
- `POST /api/seats/release` ? Manually release held seats
- `POST /api/bookings` ? Confirm checkout, update seats to `BOOKED`, generate QR ticket & email
- `GET /api/bookings/my` ? List customer booking history
- `POST /api/bookings/:id/cancel` ? Cancel booking and trigger waitlist auto-assignment

### Waitlist
- `POST /api/waitlist/join` ? Join FIFO queue for sold-out showtime & category
- `GET /api/waitlist/offer/:claimToken` ? Fetch time-limited waitlist offer details
- `POST /api/waitlist/claim` ? Claim and book allocated waitlist seat

### Organiser & Admin
- `GET /api/organiser/dashboard` ? Revenue, tickets sold, occupancy %, waitlist counts
- `GET /api/venues` ? List venues & physical layouts
- `POST /api/venues` ? Create venue layout (`ADMIN`)
