// src/controllers/order.controller.ts

import { Request, Response, NextFunction } from 'express';
import { createOrder, getOrderById } from '../services/order.services.js';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client_id = res.locals.client_id;
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ success: false, error: 'amount must be a positive number' });
      return;
    }

    const order = await createOrder(client_id, amount);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client_id = res.locals.client_id;
    const { order_id } = req.params;

    if (!order_id) {
      res.status(400).json({ success: false, error: 'order_id is required' });
      return;
    }

    const order = await getOrderById(client_id, order_id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
