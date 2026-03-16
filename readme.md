# Wallet Transaction System

A simple transaction system that maintains a wallet per client. Admin users can credit or debit wallet balances. Clients can create orders that deduct from their wallet and trigger a fulfillment API.

---

## Tech Stack

- **Runtime:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 15
- **Containerization:** Docker + Docker Compose

---

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Run

```bash
# Clone the repo
git clone <repo-url>
cd <repo-folder>

# Copy env
cp .env.example .env

# Start everything
docker compose up --build
```

The server starts on `http://localhost:3000`. PostgreSQL starts on port `5432`.

> The schema is auto-applied via `src/db/init.sql` on first boot. No migration step needed.

### Stop

```bash
docker compose down

# To also wipe the database volume
docker compose down -v
```

---

## Project Structure

```
/
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── src/
    ├── app.ts                        # Entry point, DB retry, server bootstrap
    ├── db/
    │   ├── index.ts                  # pg Pool + query helper
    │   └── init.sql                  # Schema (auto-runs on first boot)
    ├── routes/
    │   ├── admin.routes.ts
    │   ├── order.routes.ts
    │   └── wallet.routes.ts
    ├── controllers/
    │   ├── admin.controller.ts
    │   ├── order.controller.ts
    │   └── wallet.controller.ts
    ├── services/
    │   ├── wallet.service.ts
    │   ├── order.service.ts
    │   └── fulfillment.service.ts
    └── middlewares/
        ├── auth.middleware.ts
        └── error.middleware.ts
```

---

## Database Schema

### `wallets`
| Column | Type | Notes |
|---|---|---|
| client_id | VARCHAR(50) | Primary key |
| balance | NUMERIC(12,2) | Never goes negative |
| created_at | TIMESTAMPTZ | Auto |

### `ledger`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL | Primary key |
| client_id | VARCHAR(50) | FK → wallets |
| type | VARCHAR(10) | `credit` or `debit` |
| amount | NUMERIC(12,2) | |
| reference_id | VARCHAR(50) | order_id for order deductions |
| created_at | TIMESTAMPTZ | Auto |

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Auto-generated |
| client_id | VARCHAR(50) | FK → wallets |
| amount | NUMERIC(12,2) | |
| status | VARCHAR(10) | `pending`, `fulfilled`, `failed` |
| fulfillment_id | VARCHAR(100) | Returned by fulfillment API |
| created_at | TIMESTAMPTZ | Auto |

---

## Key Design Decisions

### Atomic Wallet Deduction
The wallet deduction during order creation uses a single SQL statement with a conditional `WHERE balance >= amount`. This prevents race conditions where two concurrent requests could both pass a balance check and result in a negative balance.

```sql
UPDATE wallets
SET balance = balance - $1
WHERE client_id = $2 AND balance >= $1
RETURNING *
```

If `rowCount === 0`, the operation failed — either insufficient balance or wallet not found.

### Fulfillment Failure Rollback
If the fulfillment API call fails after the wallet has already been deducted, the system automatically refunds the wallet and logs a corresponding credit entry in the ledger. The order is marked as `failed`. In production, a retry queue (e.g. BullMQ or Inngest) would be preferable over an immediate rollback.

### Order Created Before Deduction
The order row is inserted as `pending` before the wallet deduction. This ensures every order attempt — including failures — is traceable in the database.

### NUMERIC over FLOAT
All monetary values use `NUMERIC(12,2)` to avoid floating point precision issues.

### Ledger Separation
A separate `ledger` table tracks every balance change with a `reference_id` linking back to the order that caused it. This provides a full audit trail independent of the wallet's current balance.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| DATABASE_URL | PostgreSQL connection string | `postgres://admin:secret@db:5432/wallet_db` |
| PORT | Server port | `3000` |