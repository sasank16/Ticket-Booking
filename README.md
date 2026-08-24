
# SeatSwift — Next-Gen Ticket Booking & Concurrency Engine

A high-performance ticket booking platform for movies and concerts featuring interactive visual seat maps, TTL-based seat hold auto-release, concurrency protection, FIFO waitlist reallocation, role-based authentication, and QR-code ticketing.

---

## 🚀 Key Highlights & Architecture
* **Visual Seat Map** — Interactive grid with row/column coordinates, tier-based pricing (VIP / Premium / Standard), and live screen curvature.
* **Seat Hold TTL & Auto-Release** — Configurable 10-minute hold window with a digital countdown timer and background auto-release worker.
* **Concurrency Protection** — Atomic database transactions prevent simultaneous hold attempts for the exact same seat.
* **Automated Waitlist Engine** — First-come-first-served (FIFO) seat reallocation upon ticket cancellation with time-limited claim tokens and notification emails.
* **Real-Time Live Sync** — WebSocket gateway broadcasts instant seat status changes (`AVAILABLE`, `HELD`, `BOOKED`) to all connected users.
* **QR Code Ticketing** — Generates cryptographically verifiable QR codes and delivers tickets via email.
* **Role-Based Access Control (RBAC)**:
  * **Customer** — Browse events, select seats, hold seats, checkout, view QR tickets, and cancel bookings.
  * **Organiser** — Create events, schedule showtimes, configure tier pricing, and view live revenue and occupancy metrics.
  * **Admin** — Create venues, customize row/column layouts, and configure seat category mappings.

---

## 🛠️ Tech Stack

### Backend
* **Node.js** & **TypeScript**
* **Express**
* **Prisma ORM**
* **SQLite** (local development) / **PostgreSQL** (production)
* **Socket.IO**
* **Nodemailer**
* **QRCode**
* **Zod**

### Frontend
* **React 18**
* **Vite**
* **TypeScript**
* **Tailwind CSS**
* **Lucide Icons**
* **Canvas Confetti**

---

## 🏁 Quickstart Guide

### Prerequisites
Make sure you have the following installed:
* Node.js v18+
* npm v9+

### Backend Setup
```bash
cd backend
npm install
npm run prisma:push
npm run prisma:seed
npm run dev
```

The backend API will start at:
```
http://localhost:5000
```

### Frontend Setup
Open another terminal and run:
```bash
cd frontend
npm install
npm run dev
```

The frontend application will start at:
```
http://localhost:5173
```

---

## 🧪 Automated Concurrency Test

SeatSwift includes a simulated race-condition test to verify that multiple users cannot hold the same seat simultaneously.

The test simulates 10 users attempting to hold the exact same seat at the same time:

```bash
cd backend
npm run test:concurrency
```

### Expected Output
```
RESULTS:
  Successful Holds: 1
  Rejected Conflicts: 9

CONCURRENCY PROTECTION PASSED:
Exactly 1 customer won the hold lock,
9 were prevented from double-booking!
```

This verifies that the database transaction and concurrency protection mechanisms are working correctly.

---

## 🔑 Pre-Seeded Demo Accounts

All demo accounts use the password:
```
password123
```

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Customer** | `customer@seatswift.com` | Browse events, hold seats, checkout, view QR tickets, cancel bookings |
| **Organiser** | `organiser@seatswift.com` | View analytics dashboard, sales, and occupancy |
| **Admin** | `admin@seatswift.com` | Manage venues and seat layout builder |

> **Note**: These credentials are intended for local development and demonstration purposes only. Do not use them in production.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user (`CUSTOMER`, `ORGANISER`, `ADMIN`) |
| `POST` | `/api/auth/login` | Login and receive a JWT bearer token |
| `GET` | `/api/auth/me` | Get the current user's profile |

### Events & Showtimes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/events` | List events with filters such as category, city, and search |
| `GET` | `/api/events/:id` | Get event details with venue and showtimes |
| `POST` | `/api/events` | Create an event (`ORGANISER` / `ADMIN`) |
| `GET` | `/api/showtimes/:id/seats` | Get the live seat map and current seat statuses |
| `POST` | `/api/showtimes` | Create a showtime with category pricing (`ORGANISER` / `ADMIN`) |

### Seat Hold & Booking
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/seats/hold` | Atomically hold selected seats with a 10-minute TTL |
| `POST` | `/api/seats/release` | Manually release held seats |
| `POST` | `/api/bookings` | Confirm checkout, book seats, generate QR ticket, and send email |
| `GET` | `/api/bookings/my` | List the customer's booking history |
| `POST` | `/api/bookings/:id/cancel` | Cancel a booking and trigger waitlist auto-assignment |

### Waitlist
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/waitlist/join` | Join the FIFO queue for a sold-out showtime and category |
| `GET` | `/api/waitlist/offer/:claimToken` | Fetch time-limited waitlist offer details |
| `POST` | `/api/waitlist/claim` | Claim and book an allocated waitlist seat |

### Organiser & Admin
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/organiser/dashboard` | View revenue, tickets sold, occupancy, and waitlist metrics |
| `GET` | `/api/venues` | List venues and physical seat layouts |
| `POST` | `/api/venues` | Create a venue layout (`ADMIN`) |

---

## 🔄 Seat Status Flow

Seat availability follows this lifecycle:

```
AVAILABLE
    |
    v
  HELD
    |
    +------------------+
    |                  |
    v                  v
 BOOKED          AUTO-RELEASE
                       |
                       v
                   AVAILABLE
```

When a customer holds a seat, it remains `HELD` for the configured TTL period. If the customer completes checkout before the hold expires, the seat becomes `BOOKED`. Otherwise, the background worker automatically releases the seat back to `AVAILABLE`.

---

## 🛡️ Concurrency Protection

SeatSwift is designed to prevent double-booking during high-concurrency scenarios.

When multiple customers attempt to hold the same seat simultaneously:

```
Customer 1 ──┐
Customer 2 ──┤
Customer 3 ──┤
Customer 4 ──┼──> Atomic Database Transaction ──> Seat Lock
Customer 5 ──┤
Customer 6 ──┤
Customer 7 ──┤
Customer 8 ──┤
Customer 9 ──┤
Customer 10 ─┘

                     |
                     v

             1 Successful Hold
             9 Rejected Conflicts
```

This ensures that only one customer can successfully acquire the seat hold.

---

## ⚡ Real-Time Seat Synchronization

SeatSwift uses Socket.IO to broadcast seat state changes to connected clients.

Supported seat states:
* `AVAILABLE`
* `HELD`
* `BOOKED`

When a seat is held, released, or booked, connected users receive the updated status in real time without requiring a page refresh.

---

## ⏳ Waitlist System

When a showtime or seat category becomes sold out, customers can join a FIFO waitlist.

When a booked seat is cancelled:
1. The system identifies the next eligible customer in the FIFO queue.
2. A temporary claim token is generated.
3. The customer receives a notification email.
4. The customer receives a limited amount of time (10 min TTL) to claim the seat.
5. If the offer expires, the seat is reallocated to the next customer in the queue.

---

## 📁 Project Structure

```
SeatSwift/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── jobs/
│   │   └── scripts/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types.ts
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   └── system_design.md
└── README.md
```

---

## 🔒 Security & Authentication

SeatSwift uses role-based access control to protect privileged operations.

Supported roles:
* `CUSTOMER`
* `ORGANISER`
* `ADMIN`

JWT bearer authentication is used for protected API endpoints, while role-based middleware restricts access to organiser and admin functionality.

---

## 🗄️ Database

### Local Development
SQLite is used for convenient local development and zero-configuration setup.

### Production
PostgreSQL is recommended for production deployments and high-concurrency workloads.

Prisma ORM provides the database abstraction layer and handles schema management across both.

---

## 🔮 Future Improvements

Potential future enhancements include:
* Payment gateway integration (Stripe / Razorpay)
* Redis-based distributed locking (Redlock)
* Kubernetes deployment & containerization
* Horizontal WebSocket scaling via Redis pub/sub adapter
* Advanced event analytics & heatmaps
* Mobile application (React Native)
* Push notifications
* Dynamic pricing algorithms
* Multi-language & multi-currency support
* Cloud-based QR ticket scanning scanner app

---

## 📄 License

This project is intended for educational, demonstration, and development purposes.
