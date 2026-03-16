
import { Request, Response, NextFunction } from 'express';
import { creditWallet, debitWallet } from '../services/wallet.services.js';

export const credit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { client_id, amount } = req.body;

    if (!client_id || typeof client_id !== 'string') {
      res.status(400).json({ success: false, error: 'client_id is required' });
      return;
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ success: false, error: 'amount must be a positive number' });
      return;
    }

    const wallet = await creditWallet(client_id, amount);
    res.status(200).json({ success: true, data: wallet });
  } catch (err) {
    next(err);
  }
};

export const debit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { client_id, amount } = req.body;

    if (!client_id || typeof client_id !== 'string') {
      res.status(400).json({ success: false, error: 'client_id is required' });
      return;
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ success: false, error: 'amount must be a positive number' });
      return;
    }

    const wallet = await debitWallet(client_id, amount);
    res.status(200).json({ success: true, data: wallet });
  } catch (err) {
    next(err); // INSUFFICIENT_BALANCE handled by error middleware
  }
};
