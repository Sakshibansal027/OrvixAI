import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  MONGO_DB_NAME: z.string().min(1).default('orvix'),
  LLM_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  LLM_MODEL: z.string().min(1).default('gemini-3.8-flash'),
  LLM_API_KEY: z.string().optional()
}).superRefine((env, context) => {
  if (env.LLM_PROVIDER === 'gemini' && !env.LLM_API_KEY?.trim()) {
    context.addIssue({ code: 'custom', path: ['LLM_API_KEY'], message: 'LLM_API_KEY is required when LLM_PROVIDER=gemini' });
  }
});

export const env = envSchema.parse(process.env);
