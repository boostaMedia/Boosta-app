import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated, type-safe environment variables.
 *
 * Access variables through this object (`env.NEXT_PUBLIC_APP_URL`) rather than
 * `process.env` so that missing or malformed values fail fast at build/boot
 * time with a descriptive error, and so that types are inferred everywhere.
 *
 * Add new variables to the appropriate `server` / `client` block AND to
 * `runtimeEnv`. Client variables must be prefixed with `NEXT_PUBLIC_`.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Server-only service-role key. Never expose to the client. Optional so
    // the app builds without secrets; required only for privileged operations.
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Boosta"),
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
    // Supabase project connection. Optional at build time; the Supabase client
    // factories assert their presence at runtime with a clear error.
    NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Treat empty strings as "not set" so a blank `.env` value uses the default.
  emptyStringAsUndefined: true,
  // Allow skipping validation in contexts where env is intentionally absent
  // (e.g. linting in CI). Never set this in application runtime code.
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
