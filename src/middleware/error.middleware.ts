
import { Request, Response, NextFunction } from 'express';

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  INSUFFICIENT_BALANCE: { status: 400, message: 'Insufficient wallet balance' },
  FULFILLMENT_FAILED: { status: 502, message: 'Fulfillment service unavailable' },
  NOT_FOUND: { status: 404, message: 'Resource not found' },
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const mapped = ERROR_MAP[err.message];

  if (mapped) {
    res.status(mapped.status).json({ success: false, error: mapped.message });
    return;
  }

  // Unexpected error — don't leak internals
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
};
