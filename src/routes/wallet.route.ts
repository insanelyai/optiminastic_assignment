// src/routes/wallet.routes.ts

import { Router } from 'express';
import { getBalance } from '../controllers/wallet.controller.js';
import { requireClientId } from '@/middleware/auth.middleware.js';

const router = Router();

router.get('/balance', requireClientId, getBalance);

export default router;
