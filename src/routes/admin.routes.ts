// src/routes/admin.routes.ts

import { Router } from 'express';
import { credit, debit } from '../controllers/admin.controller.js';

const router = Router();

router.post('/wallet/credit', credit);
router.post('/wallet/debit', debit);

export default router;
