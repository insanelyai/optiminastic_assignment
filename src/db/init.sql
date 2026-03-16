CREATE TABLE IF NOT EXISTS wallets (
  client_id   VARCHAR(50) PRIMARY KEY,
  balance     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger (
  id           SERIAL PRIMARY KEY,
  client_id    VARCHAR(50) NOT NULL REFERENCES wallets(client_id),
  type         VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
  amount       NUMERIC(12, 2) NOT NULL,
  reference_id VARCHAR(50),   -- order_id for order deductions
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      VARCHAR(50) NOT NULL REFERENCES wallets(client_id),
  amount         NUMERIC(12, 2) NOT NULL,
  status         VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'failed')),
  fulfillment_id VARCHAR(100),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);