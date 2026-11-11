# Technical Report: Cinema Hall Ticket Booking System
**Candidate Assessment Submission**  
**Role:** Full-Stack Web Development  
**Organization:** Algions AI Labs Private Limited  

---

## 1. Architectural Strategy & Design Patterns

### 1.1 Architecture Style: Modular Monolith
In accordance with section 2 of the SRS ("A modular monolith is sufficient; microservices are not required"), the system is built as a unified Next.js 15 application. 

**Benefits:**
- **Zero Network Boundary Latency:** Database transactions span holds, bookings, tickets, and payments without distributed transaction overhead (no two-phase commits or saga orchestration).
- **Strong Type Safety:** Single TypeScript type domain shared between client views, Zod request schemas, and Prisma ORM models.
- **Single Operational Artifact:** Straightforward local evaluation via `npm install && npm run dev` without requiring Docker daemon or orchestrators.

---

## 2. Concurrency & Seat Locking Engine

The central technical challenge of any cinema ticketing engine is the **double booking problem**: preventing two simultaneous users from booking the same seat for the same show.

### 2.1 Two-Tier Lock Architecture

1. **Transient Lock (TTL Hold):**
   - Implemented via `SeatHold` records carrying an `expiresAt = NOW() + 8 minutes`.
   - When a user selects a seat on the visual layout, `/api/shows/[id]/hold` atomically checks:
     - Is the seat active in `BOOKING_SEAT` with a `CONFIRMED` booking?
     - Is the seat held by another user with `expiresAt > NOW()`?
   - If clean, creates a hold. Expired holds are purged dynamically on query, ensuring zero orphan locks without requiring external daemon schedulers.

2. **Permanent Invariant Lock (Unique Composite Constraint):**
   - At the persistence layer, `BookingSeat` has a column:
     ```prisma
     activeShowSeatKey String? @unique
     ```
   - When a booking is confirmed, this field is set to `${showId}_${seatId}`.
   - When a booking is cancelled, this field is set to `null`.
   - **Mathematical Guarantee:** In SQL (SQLite/PostgreSQL), multiple `NULL` values are permitted in unique indexes, but non-null values must be unique. Even under high concurrency collisions, the database engine enforces atomicity and raises constraint errors (`P2002`), which our service translates into an informative user error.

---

## 3. Server-Side Role-Based Access Control (RBAC)

The system distinguishes three primary personas:
- `CUSTOMER`: Browse catalog, place holds, checkout, view passes, cancel tickets.
- `STAFF`: Turnstile check-in, validate ticket QR tokens, review occupancy.
- `ADMIN`: Full configuration, movie and show scheduling, financial reconciliation, audit logs.

### 3.1 Security Enforcement
Authorization is enforced server-side on every API handler using `requireAuth(request, ['ADMIN', 'STAFF'])`. The auth middleware decodes the signed JWT cookie or Bearer header, validates signature integrity and expiration, and checks the role claim. UI buttons for admin views are conditionally rendered for convenience, but the API rejects unauthorized requests with `401 Unauthorized` or `403 Forbidden`.

---

## 4. Single-Use Gate Entry Flow (Acceptance Test 4)

To satisfy Acceptance Criterion 4:
1. Every confirmed booking generates a `Ticket` entity with a cryptographically unique `qrValidationToken` (e.g. `TCK-89AB12CD`).
2. When gate staff scans the QR pass at `/admin/scan`:
   - Checks if ticket exists: `404 Not Found` if missing.
   - Checks if booking was cancelled: `400 Cancelled` if refunded.
   - Checks if already redeemed: `400 Already Redeemed` with redemption timestamp.
   - If valid, atomically marks `validationStatus = 'REDEEMED'`, stamps `redeemedAt`, and records the staff user's ID.
   - Emits an `AuditLog` event (`TICKET_REDEEMED`).

---

## 5. Capacity & Occupancy Reconciliation (Acceptance Test 5)

A cinema business requires zero-discrepancy seat reconciliation. The reporting service computes real-time statistics per show and asserts:

$$\text{Capacity} = \text{Booked Seats} + \text{Held Seats} (\text{TTL Active}) + \text{Available Seats}$$

If any seat is leaked or untracked, the dashboard triggers an alert. In all automated tests and live evaluations, `summary.allShowsReconciled` remains `true` ($100\%$).

---

## 6. Testing & Quality Assurance

Automated acceptance tests were written using **Vitest**:
- **Concurrency collision test:** Simulates two distinct users attempting to confirm the identical seat for the same showtime.
- **Hold expiration test:** Artificially ages a hold past its TTL to verify dynamic release without background worker lag.
- **QR single-use verification:** Tests successive scans of the same ticket to ensure repeat admissions are denied.
- **Reconciliation test:** Verifies capacity conservation equations across all shows.

```bash
npm test
# Result: 5 passed (5 tests)
```

---

## 7. Walkthrough Video Script / Demo Flow (3–5 Minutes)

For the 3–5 minute video demonstration required by Algions AI Labs:
1. **0:00 - 0:45 (Customer Discovery):** Open homepage at `http://localhost:3000`. Show movies, genre filter, and showtimes.
2. **0:45 - 1:45 (Interactive Seat Map & Hold TTL):** Click on *Dune: Part Two (IMAX)*. Select seats in Gold and Recliner rows. Click "Lock Seats" and observe the 8-minute countdown timer.
3. **1:45 - 2:30 (Checkout & Digital QR Pass):** Click "Proceed to Checkout". Select "Simulated Credit Card". Pay and view the digital ticket with verified QR code.
4. **2:30 - 3:30 (Gate Entry Check-in):** Switch to Staff role via Fast-Track. Open `/admin/scan`. Scan or paste the ticket token. Show green "ENTRY GRANTED". Scan again immediately to demonstrate red "ENTRY DENIED: ALREADY REDEEMED".
5. **3:30 - 4:15 (Cancellation & Refund):** Go to *My Bookings*. Cancel a booking. Show immediate seat release and status update to `CANCELLED (Refund: COMPLETED)`.
6. **4:15 - 5:00 (Admin Analytics & Audit):** Open `/admin`. Show the 100% Reconciled table, show revenue, and audit trail of all previous actions.

