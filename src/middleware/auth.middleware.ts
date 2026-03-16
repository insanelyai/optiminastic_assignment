import { Request, Response, NextFunction } from 'express';

export const requireClientId = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.headers['client-id'];

  if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
    res.status(401).json({ success: false, error: 'Missing client-id header' });
    return;
  }

  // Attach to res.locals so controllers can access it cleanly
  res.locals.client_id = clientId.trim();
  next();
};
