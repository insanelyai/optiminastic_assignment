# API Documentation

Base URL: `http://localhost:3000`

All responses follow a consistent shape:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Error message" }
```

---

## Admin Endpoints

> No authentication required. Admin routes are assumed to be internal/trusted.

---

### Credit Wallet

`POST /admin/wallet/credit`

Credits an amount to a client's wallet. Creates the wallet automatically if it doesn't exist (upsert).

**Request Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| client_id | string | Yes | The client identifier |
| amount | number | Yes | Must be a positive number |

**Example Request**

```bash
curl -X POST http://localhost:3000/admin/wallet/credit \
  -H "Content-Type: application/json" \
  -d '{ "client_id": "client_001", "amount": 500 }'
```

**Example Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "client_id": "client_001",
    "balance": "500.00",
    "created_at": "2025-01-01T10:00:00.000Z"
  }
}
```

**Error Responses**

| Status | Error |
|---|---|
| 400 | `client_id is required` |
| 400 | `amount must be a positive number` |

---

### Debit Wallet

`POST /admin/wallet/debit`

Debits an amount from a client's wallet. Fails if balance is insufficient.

**Request Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| client_id | string | Yes | The client identifier |
| amount | number | Yes | Must be a positive number |

**Example Request**

```bash
curl -X POST http://localhost:3000/admin/wallet/debit \
  -H "Content-Type: application/json" \
  -d '{ "client_id": "client_001", "amount": 100 }'
```

**Example Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "client_id": "client_001",
    "balance": "400.00",
    "created_at": "2025-01-01T10:00:00.000Z"
  }
}
```

**Error Responses**

| Status | Error |
|---|---|
| 400 | `client_id is required` |
| 400 | `amount must be a positive number` |
| 400 | `Insufficient wallet balance` |
| 404 | `Resource not found` |

---

## Client Endpoints

> All client endpoints require a `client-id` header.

---

### Get Wallet Balance

`GET /wallet/balance`

Returns the current wallet balance for the authenticated client.

**Headers**

| Header | Required | Notes |
|---|---|---|
| client-id | Yes | The client identifier |

**Example Request**

```bash
curl http://localhost:3000/wallet/balance \
  -H "client-id: client_001"
```

**Example Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "client_id": "client_001",
    "balance": "400.00",
    "created_at": "2025-01-01T10:00:00.000Z"
  }
}
```

**Error Responses**

| Status | Error |
|---|---|
| 401 | `Missing client-id header` |
| 404 | `Wallet not found` |

---

### Create Order

`POST /orders`

Creates a new order. Atomically deducts the amount from the wallet, calls the fulfillment API, and stores the returned fulfillment ID.

**Headers**

| Header | Required | Notes |
|---|---|---|
| client-id | Yes | The client identifier |

**Request Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| amount | number | Yes | Must be a positive number |

**Example Request**

```bash
curl -X POST http://localhost:3000/orders \
  -H "client-id: client_001" \
  -H "Content-Type: application/json" \
  -d '{ "amount": 150 }'
```

**Example Response** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "client_id": "client_001",
    "amount": "150.00",
    "status": "fulfilled",
    "fulfillment_id": "101",
    "created_at": "2025-01-01T10:05:00.000Z"
  }
}
```

**Order Flow**

```
1. Validate amount
2. Insert order as status=pending
3. Atomic wallet deduction (WHERE balance >= amount)
4. Call fulfillment API → receive fulfillment_id
5. Update order → status=fulfilled, store fulfillment_id
```

**On Fulfillment Failure**

If the fulfillment API call fails after deduction, the system automatically:
- Refunds the wallet
- Logs a credit entry in the ledger
- Marks the order as `status=failed`

**Error Responses**

| Status | Error |
|---|---|
| 400 | `amount must be a positive number` |
| 400 | `Insufficient wallet balance` |
| 401 | `Missing client-id header` |
| 404 | `Resource not found` |
| 502 | `Fulfillment service unavailable` |

---

### Get Order Details

`GET /orders/:order_id`

Returns order details. A client can only retrieve their own orders.

**Headers**

| Header | Required | Notes |
|---|---|---|
| client-id | Yes | The client identifier |

**Path Parameters**

| Parameter | Type | Notes |
|---|---|---|
| order_id | UUID | The order ID returned from POST /orders |

**Example Request**

```bash
curl http://localhost:3000/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "client-id: client_001"
```

**Example Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "client_id": "client_001",
    "amount": "150.00",
    "status": "fulfilled",
    "fulfillment_id": "101",
    "created_at": "2025-01-01T10:05:00.000Z"
  }
}
```

**Error Responses**

| Status | Error |
|---|---|
| 401 | `Missing client-id header` |
| 404 | `Order not found` |

---

## Error Reference

| Error String | HTTP Status | Cause |
|---|---|---|
| `Missing client-id header` | 401 | `client-id` header missing or empty |
| `Insufficient wallet balance` | 400 | Debit or order amount exceeds balance |
| `Resource not found` | 404 | Wallet or client does not exist |
| `Fulfillment service unavailable` | 502 | External fulfillment API returned non-2xx |
| `Internal server error` | 500 | Unexpected server error |

---

## AI Prompts Used

This project was built with AI assistance. Below are the exact prompts used during development.

---

**System Design & Planning**

> *"this is my assignment, lets plan the structure the edges cases for this. also using express with typescript (not need to code yet -- i already have a template setup)"*

Used to plan the full project structure, data models, edge cases, and key design decisions (atomic deduction, fulfillment rollback strategy, ledger design).

---

**Docker & Database Setup**

> *"okay so we will be using postgres db and also lets do docker for easy setup and firing the server"*

Used to design the Docker Compose setup, Dockerfile (multi-stage), init.sql schema, and the DB connection retry strategy.

---

**Service Layer**

> *"okay, i'm a bit short on time db folder is done wallet.services is done"*

> *"order and fulfillment is done. about middleware for auth - not mentioned in the docs so lets do whats necessary for now"*

Used to generate `fulfillment.service.ts`, `order.service.ts`, and both middleware files (`auth.middleware.ts`, `error.middleware.ts`).

---

**Controllers**

> *"yes sir, lets do it"*

Used to generate all three controllers (`admin.controller.ts`, `wallet.controller.ts`, `order.controller.ts`).

---

**Wallet Service**

> *"before docker lets do wallet.service, we dont have getWalletBalance, creditWallet, debitWallet yet"*

Used to generate the complete `wallet.service.ts` including the atomic deduction pattern and upsert logic for credit.

---

**Routes & App Bootstrap**

> *"yes routes and docker"*

Used to generate all route files, the final `app.ts` wiring, and Docker configuration.

---

**Bug Fix**

> *"note admin.controller has functions with params cannot directly attach to the router"*

Identified a filename typo in the import path (`wallet.services.js` → `wallet.service.js`).