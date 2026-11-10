# CineBook — Cinema Hall Ticket Booking System
### Full-Stack Web Development | Advanced Individual Project Assessment
**Organization:** Algions AI Labs Private Limited  
**Assigned Domain:** Cinema Hall Ticket Booking System  

---

## 1. Executive Summary & Overview

**CineBook** is a production-grade cinema hall ticket booking platform built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM (SQLite / PostgreSQL)**. 

The application implements end-to-end customer and administrative journeys, featuring:
- **Temporary Seat Holds (TTL Locks):** Locks chosen seats for 8 minutes to prevent race conditions.
- **Strict Concurrency Protection:** Composite database-level unique constraints (`activeShowSeatKey = showId + "_" + seatId`) that mathematically eliminate double bookings.
- **Single-Use Gatekeeper Token:** Generates digital passes with verifiable QR codes that can only be redeemed once by gate staff.
- **Live Reconciliation Dashboard:** Admin analytics proving that $\text{Booked} + \text{Held} + \text{Available} = \text{Total Capacity}$ at all times.
- **Audit Trail:** Immutable record of security and material business actions (show creation, confirmations, cancellations, turnstile redemptions).
- **Interactive OpenAPI / Swagger Documentation:** Live API exploration at `/api/docs`.

---

## 2. System Architecture

The project adheres to the **Modular Monolith** architecture recommended by the SRS, ensuring clean separation between presentation, domain business rules, and persistence:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│  Customer UI (Browsing, Seat Map, TTL Hold Timer, Checkout, Passes)   │
│  Staff / Admin UI (Occupancy Reports, Turnstile Scanner, Schedules)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       SERVER & API LAYER (/api)                        │
│  • Server-Side RBAC Guard (JWT HttpOnly Cookies / Bearer Header)       │
│  • Zod Request Validation & Standard Error Payloads                   │
│  • OpenAPI 3.0 / Swagger Interactive Explorer (/api/docs)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DOMAIN & BUSINESS LOGIC (src/server)                 │
│  • SeatHoldService: Atomic hold reservation, TTL expiry & cleanup      │
│  • BookingService: Transactional booking, double-booking guard         │
│  • TicketService: Single-use cryptographic QR validation token         │
│  • ReportingService: Capacity & financial reconciliation               │
│  • AuditService: Non-blocking structured audit trail logging           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE LAYER (Prisma)                        │
│  • ACID Transactions & Composite Unique Constraints                    │
│  • SQLite (Default zero-config) / PostgreSQL Ready                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ BOOKING : "places"
    USER ||--o{ AUDIT_LOG : "triggers"
    THEATRE ||--o{ SCREEN : "houses"
    SCREEN ||--o{ SEAT : "contains"
    SCREEN ||--o{ SHOW : "hosts"
    MOVIE ||--o{ SHOW : "scheduled as"
    SHOW ||--o{ SEAT_HOLD : "locks"
    SHOW ||--o{ BOOKING : "reserves"
    BOOKING ||--|{ BOOKING_SEAT : "includes"
    SEAT ||--o{ BOOKING_SEAT : "allocated to"
    BOOKING ||--o| TICKET : "generates"
    BOOKING ||--o{ PAYMENT : "settled via"

    USER {
        string id PK
        string email UK
        string passwordHash
        string fullName
        string role "CUSTOMER | STAFF | ADMIN"
        datetime createdAt
    }

    THEATRE {
        string id PK
        string name
        string city
        string address
    }

    SCREEN {
        string id PK
        string theatreId FK
        string name
        int totalSeats
    }

    SEAT {
        string id PK
        string screenId FK
        string rowName
        int seatNumber
        string category "SILVER | GOLD | VIP_RECLINER"
        float priceMultiplier
    }

    MOVIE {
        string id PK
        string title
        string description
        int durationMins
        string language
        string genre
        string posterUrl
        string rating
        datetime releaseDate
    }

    SHOW {
        string id PK
        string movieId FK
        string screenId FK
        datetime startTime
        datetime endTime
        float basePrice
        string format "2D | 3D | IMAX"
    }

    SEAT_HOLD {
        string id PK
        string showId FK
        string seatId FK
        string userId FK
        string holdToken
        datetime expiresAt
        datetime createdAt
    }

    BOOKING {
        string id PK
        string bookingReference UK
        string userId FK
        string showId FK
        float totalAmount
        string status "CONFIRMED | CANCELLED"
        string cancellationReason
        datetime cancelledAt
        string refundStatus "COMPLETED"
        float refundAmount
    }

    BOOKING_SEAT {
        string id PK
        string bookingId FK
        string seatId FK
        float price
        string activeShowSeatKey UK "showId_seatId (null on cancel)"
    }

    TICKET {
        string id PK
        string bookingId FK UK
        string qrValidationToken UK
        string validationStatus "VALID | REDEEMED | CANCELLED"
        datetime redeemedAt
        string redeemedByStaffId FK
    }

    PAYMENT {
        string id PK
        string bookingId FK
        string transactionReference UK
        float amount
        string method "SIMULATED_CARD | SIMULATED_UPI"
        string status "SUCCESS | REFUNDED"
    }

    AUDIT_LOG {
        string id PK
        string actorId FK
        string action
        string targetEntity
        string targetId
        string details
        datetime createdAt
    }
```

---

## 4. Acceptance Test Scenarios (100% Passed)

The test suite in [`tests/acceptance.test.ts`](tests/acceptance.test.ts) provides verified automated proof for the 5 SRS acceptance criteria:

| # | Acceptance Criterion | Implementation & Proof | Test Result |
|---|---|---|---|
| **1** | **Seat Hold & Booking** | Available seat can be placed on an 8-minute temporary hold, followed by confirmed booking issuance. | `PASSED` |
| **2** | **Double-Booking Prevention** | The exact same seat cannot be booked by two concurrent users for the same show; atomic transaction rejects conflicting request. | `PASSED` |
| **3** | **Hold Expiration & Auto-Release** | Expired holds dynamically release seats back to the available pool, while confirmed bookings remain permanently reserved. | `PASSED` |
| **4** | **Single-Use Entry Validation** | Ticket QR validation token can be verified once for entry. Second scan is rejected as `ALREADY_REDEEMED`. | `PASSED` |
| **5** | **Occupancy & Revenue Reconciliation** | Admin report proves mathematically: $\text{Booked} + \text{Held} + \text{Available} = \text{Screen Capacity}$ for every show. | `PASSED` |

To execute the automated test suite:
```bash
npm test
```

---

## 5. Quick-Start Guide (Local Setup)

### Prerequisites
- **Node.js** (v18.x, v20.x, or v22.x)
- **npm** (v9.x or v10.x)

### 1. Clone & Install Dependencies
```bash
git clone <repository_url>
cd cinema-project
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Default values in `.env.example` work out-of-the-box using local SQLite).*

### 3. Initialize & Seed Database
```bash
# Push Prisma schema to create SQLite database tables
npm run db:push

# Seed movies, screens, 90 seats (Silver/Gold/Recliner), shows, and demo passes
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 6. Pre-Configured Demo Credentials

The login page (`/login`) and homepage (`/`) feature **1-Click Evaluator Fast-Track Buttons** to switch personas instantly:

| Persona | Email | Password | Primary Capabilities |
|---|---|---|---|
| **Customer** | `customer@cinema.com` | `password123` | Browse catalog, select seats, hold timer, simulated checkout, digital pass QR, cancel tickets |
| **Staff Operator** | `staff@cinema.com` | `staff123` | Turnstile gate QR scanner, single-use check-in, real-time occupancy |
| **Administrator** | `admin@cinema.com` | `admin123` | Full dashboard, occupancy & revenue reconciliation, schedule shows, create movies, audit logs |

---

## 7. Interactive API Documentation

The REST API is documented via **OpenAPI 3.0** with an interactive Swagger UI:
- **Interactive UI:** Navigate to **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**
- **Raw JSON Spec:** `GET http://localhost:3000/api/docs?format=json`

---

## 8. Key Architectural & Security Decisions

1. **Anti-Double Booking Constraint:**
   Rather than relying purely on application-level locks, `BookingSeat` includes an `activeShowSeatKey` unique constraint (`"${showId}_${seatId}"`). Even if concurrent requests bypass application logic, the database engine enforces serializable safety.
2. **Server-Side RBAC:**
   Every protected API endpoint (`/api/admin/*`, `/api/tickets/validate`, `/api/shows`, etc.) explicitly inspects JWT session claims. Role validation is never left to UI element toggling.
3. **Audit Trail:**
   Security events, gate admissions, cancellations, and schedule updates emit structured records in the `AuditLog` table.
4. **Sandboxed Payment Simulation:**
   Users can test "Success", "Declined / Insufficient Funds", and "Gateway Timeout" scenarios safely without real credentials.

---

## 9. Known Assumptions & Limitations

- **Database:** Defaults to SQLite for frictionless local review. To switch to PostgreSQL in production, update `datasource db { provider = "postgresql" }` in `prisma/schema.prisma` and set `DATABASE_URL`.
- **Payment Gateway:** Intentionally simulated to comply with assignment guidelines prohibiting live payment credentials or external paid API services.
