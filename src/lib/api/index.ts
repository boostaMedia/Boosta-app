/**
 * Shared API foundation: response envelopes, the error-handling route wrapper,
 * request validation, and pagination helpers. Framework-level utilities with no
 * feature dependencies.
 */
export { jsonOk, jsonCreated, jsonNoContent, jsonPaginated } from "./response";
export { route, type RouteHandler } from "./handler";
export { parseBody, parseQuery } from "./validation";
export {
  paginationQuerySchema,
  type PaginationQuery,
  rangeFor,
  paginate,
} from "./pagination";
