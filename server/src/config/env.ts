import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  MONGO_DB_NAME: z.string().min(1).default('orvix'),
  LLM_PROVIDER: z.string().default('mock'),
  LLM_API_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);
