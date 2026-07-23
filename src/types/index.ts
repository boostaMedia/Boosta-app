/**
 * Shared, cross-cutting type definitions. Feature-specific types belong in the
 * owning feature module (`src/features/<feature>/types.ts`).
 */

/** A discriminated result type for operations that can fail expectedly. */
export type Result<T, E = Error> =
  { ok: true; data: T } | { ok: false; error: E };

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Standard shape for paginated list responses. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Utility: make selected keys optional. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Utility: a value that may still be loading. */
export type Nullable<T> = T | null;
