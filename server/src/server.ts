import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './db/mongoose.js';

async function start(): Promise<void> {
  await connectDatabase();
  app.listen(env.PORT, () => {
    console.log(`ORVIX API listening on http://localhost:${env.PORT}`);
  });
}

start().catch((error: unknown) => {
  console.error('Unable to start ORVIX API:', error);
  process.exitCode = 1;
});
