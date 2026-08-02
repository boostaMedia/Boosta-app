import { NextResponse } from "next/server";

import { toAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "api" });

/**
 * A route handler in Boosta's API. May throw an {@link AppError} (or any
 * error) — the {@link route} wrapper maps it to a JSON error response.
 */
export type RouteHandler<Context> = (
  request: Request,
  context: Context,
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap a route handler with centralized error handling. Thrown `AppError`s
 * become their mapped HTTP status + JSON body; anything else becomes a 500
 * without leaking internals. All failures are logged.
 *
 * ```ts
 * export const GET = route(async (req) => {
 *   const data = await service.list();
 *   return jsonOk(data);
 * });
 * ```
 */
export function route<Context = unknown>(
  handler: RouteHandler<Context>,
): RouteHandler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const appError = toAppError(error);
      const meta = {
        method: request.method,
        url: request.url,
        code: appError.code,
        status: appError.status,
      };

      if (appError.status >= 500) {
        log.error("request_failed", { ...meta, error: appError });
      } else {
        log.warn("request_rejected", meta);
      }

      return NextResponse.json(appError.toJSON(), { status: appError.status });
    }
  };
}
