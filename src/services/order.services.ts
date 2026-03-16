import { query } from "@/db/index.js";
import { deductForOrder } from "./wallet.services.js";
import { callFulfillmentAPI } from "./fulfillment.services.js";


export const createOrder = async (client_id: string, amount: number) => {
  // 1. Insert order as 'pending' FIRST — get the order_id
  const orderResult = await query(
    `INSERT INTO orders (client_id, amount, status)
     VALUES ($1, $2, 'pending')
     RETURNING id`,
    [client_id, amount]
  );
  const order_id = orderResult.rows[0].id;

  try {
    // 2. Atomic wallet deduction (throws if insufficient)
    await deductForOrder(client_id, amount, order_id);

    // 3. Call fulfillment API
    const fulfillment_id = await callFulfillmentAPI(client_id, order_id);

    // 4. Update order to fulfilled + store fulfillment_id
    const fulfilled = await query(
      `UPDATE orders
       SET status = 'fulfilled', fulfillment_id = $1
       WHERE id = $2
       RETURNING *`,
      [fulfillment_id, order_id]
    );

    return fulfilled.rows[0];
  } catch (err: any) {
    // 5. Rollback — mark order failed
    await query(`UPDATE orders SET status = 'failed' WHERE id = $1`, [order_id]);

    // If wallet was already deducted before fulfillment failed, refund it
    if (err.message === 'FULFILLMENT_FAILED') {
      await query(`UPDATE wallets SET balance = balance + $1 WHERE client_id = $2`, [
        amount,
        client_id,
      ]);
      // Log the refund in ledger
      await query(
        `INSERT INTO ledger (client_id, type, amount, reference_id)
         VALUES ($1, 'credit', $2, $3)`,
        [client_id, amount, order_id]
      );
    }

    throw err; // re-throw so controller handles the response
  }
};

export const getOrderById = async (client_id: string, order_id: string) => {
  const result = await query(`SELECT * FROM orders WHERE id = $1 AND client_id = $2`, [
    order_id,
    client_id,
  ]);

  if (result.rows.length === 0) return null;
  return result.rows[0];
};
