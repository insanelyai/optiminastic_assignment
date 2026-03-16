import { query } from '@/db/index.js';

export const getWalletBalance = async (client_id: string) => {
  const result = await query(`SELECT * FROM wallets WHERE client_id = $1`, [client_id]);

  return result.rows[0] ?? null;
};

export const creditWallet = async (client_id: string, amount: number) => {
  // Upsert — creates wallet if doesn't exist, credits if it does
  const result = await query(
    `INSERT INTO wallets (client_id, balance)
     VALUES ($1, $2)
     ON CONFLICT (client_id)
     DO UPDATE SET balance = wallets.balance + $2
     RETURNING *`,
    [client_id, amount]
  );

  await query(
    `INSERT INTO ledger (client_id, type, amount)
     VALUES ($1, 'credit', $2)`,
    [client_id, amount]
  );

  return result.rows[0];
};

export const debitWallet = async (client_id: string, amount: number) => {
  const result = await query(
    `UPDATE wallets
     SET balance = balance - $1
     WHERE client_id = $2 AND balance >= $1
     RETURNING *`,
    [amount, client_id]
  );

  if (result.rowCount === 0) {
    // Could be insufficient balance OR wallet doesn't exist
    // Check which one to return the right error
    const wallet = await getWalletBalance(client_id);
    if (!wallet) throw new Error('NOT_FOUND');
    throw new Error('INSUFFICIENT_BALANCE');
  }

  await query(
    `INSERT INTO ledger (client_id, type, amount)
     VALUES ($1, 'debit', $2)`,
    [client_id, amount]
  );

  return result.rows[0];
};

export const deductForOrder = async (
  client_id: string,
  amount: number,
  order_id: string
) => {
  const result = await query(
    `UPDATE wallets
     SET balance = balance - $1
     WHERE client_id = $2 AND balance >= $1
     RETURNING *`,
    [amount, client_id]
  );

  if (result.rowCount === 0) {
    const wallet = await getWalletBalance(client_id);
    if (!wallet) throw new Error('NOT_FOUND');
    throw new Error('INSUFFICIENT_BALANCE');
  }

  await query(
    `INSERT INTO ledger (client_id, type, amount, reference_id)
     VALUES ($1, 'debit', $2, $3)`,
    [client_id, amount, order_id]
  );
};
