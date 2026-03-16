import { Request, Response, Router } from 'express';

const router = Router();


// @route   GET /check
// @desc    Check endpoint
// @access  Public

router.get('/check', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

export default router;
