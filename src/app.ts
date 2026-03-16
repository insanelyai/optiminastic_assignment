// src/app.ts

import express from 'express';
import adminRoutes from './routes/admin.routes.js';
import walletRoutes from './routes/wallet.route.js';
import orderRoutes from './routes/order.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { query } from './db/index.js';

const app = express();
app.use(express.json());

// Routes
app.use('/admin', adminRoutes);
app.use('/wallet', walletRoutes);
app.use('/orders', orderRoutes);

// Error handler — must be last
app.use(errorHandler);

// DB retry on startup
const connectWithRetry = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await query('SELECT 1');
      console.log('✅ DB connected');
      return;
    } catch {
      console.log(`DB not ready, retrying in ${delay}ms... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('Could not connect to DB after retries');
};

const PORT = process.env.PORT || 3000;

connectWithRetry()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });

export default app;
