import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://placeholder-project.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("placeholder-anon-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().default("admin@msot.edu"),
  NEXT_PUBLIC_DEMO_MODE: z.string().default("true").transform((val) => val === "true"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  HMAC_SECRET: z.string().min(8).default("super-secret-trackstack-hmac-key-2026"),
  RESEND_API_KEY: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  HMAC_SECRET: process.env.HMAC_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
});
