import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, serverSelectionTimeoutMS: 5_000 });
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
