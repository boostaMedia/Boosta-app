import { NextResponse } from "next/server";

import type { Paginated } from "@/types";

/**
 * Standard success envelope: `{ data }`. Lists that are paginated additionally
 * carry a `meta` object (see {@link jsonPaginated}).
 */
export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/** 201 Created convenience wrapper. */
export function jsonCreated<T>(data: T): NextResponse {
  return jsonOk(data, 201);
}

/** 204 No Content. */
export function jsonNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/** Paginated list envelope: `{ data, meta }`. */
export function jsonPaginated<T>(result: Paginated<T>): NextResponse {
  const { items, ...meta } = result;
  return NextResponse.json({ data: items, meta });
}
