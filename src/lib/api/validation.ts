import type { z } from "zod";

import { ValidationError } from "@/lib/errors";

/**
 * Parse and validate a JSON request body against a Zod schema, throwing a
 * {@link ValidationError} (422) with structured issues on failure.
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError("Validation failed.", {
      details: { issues: result.error.issues },
    });
  }
  return result.data;
}

/**
 * Parse and validate URL search params against a Zod schema. The schema
 * receives a plain object of string values.
 */
export function parseQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T>,
): T {
  const raw = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError("Invalid query parameters.", {
      details: { issues: result.error.issues },
    });
  }
  return result.data;
}
