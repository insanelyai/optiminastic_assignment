// src/routes/order.routes.ts

import { Router } from 'express';
import { create, getById } from '../controllers/order.controller.js';
import { requireClientId } from '@/middleware/auth.middleware.js';

const router = Router();

router.post('/', requireClientId, create);
router.get('/:order_id', requireClientId, getById);

export default router;
