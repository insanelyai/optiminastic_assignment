import { Request, Response, NextFunction } from 'express';
import { getWalletBalance } from '../services/wallet.services.js';

export const getBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client_id = res.locals.client_id;

    const wallet = await getWalletBalance(client_id);

    if (!wallet) {
      res.status(404).json({ success: false, error: 'Wallet not found' });
      return;
    }

    res.status(200).json({ success: true, data: wallet });
  } catch (err) {
    next(err);
  }
};
