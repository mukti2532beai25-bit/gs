import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to local .env

const envSchema = z.object({
  PORT: z.string().default('3001').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://bahiverse:bahiverse_dev_password@localhost:5432/bahiverse_db?schema=public'),
  JWT_SECRET: z.string().default('bahiverse_dev_jwt_secret_change_in_production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.string().default('10').transform((val) => parseInt(val, 10)),
  OCR_PROVIDER: z.string().default('demo'),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_CLOUD_KEY_FILE: z.string().optional(),
  VOICE_PROVIDER: z.string().default('browser'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
