import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './db/mongoose.js';

async function start(): Promise<void> {
  app.listen(env.PORT, () => {
    console.log(`ORVIX API listening on http://localhost:${env.PORT}`);
  });

  let retryTimer: NodeJS.Timeout | undefined;
  const connectWithRetry = async (): Promise<void> => {
    try {
      await connectDatabase();
      console.log('MongoDB connected. ORVIX support data is ready.');
    } catch (error) {
      console.error('MongoDB unavailable; retrying in 5 seconds.', error instanceof Error ? error.message : error);
      retryTimer = setTimeout(connectWithRetry, 5_000);
      retryTimer.unref();
    }
  };

  void connectWithRetry();
}

start().catch((error: unknown) => {
  console.error('Unable to start ORVIX API:', error);
  process.exitCode = 1;
});
