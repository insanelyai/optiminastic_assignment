import app from './app.js';
import { env } from './config/env.js';
import { query } from './db/index.js';

const connectWithRetry = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await query('SELECT 1');
      console.log('DB connected');
      return;
    } catch {
      console.log(`DB not ready, retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('Could not connect to DB');
};

connectWithRetry();

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
});
