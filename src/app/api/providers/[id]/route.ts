import { requireApiUser } from "@/features/auth";
import {
  getProvidersService,
  updateProviderSchema,
} from "@/features/providers";
import { jsonNoContent, jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/providers/:id — public. */
export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const service = await getProvidersService();
  return jsonOk(await service.get(id));
});

/**
 * PATCH /api/providers/:id — owner (or admin) edits their profile. RLS makes
 * providers the caller does not own invisible, yielding a 404.
 */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const input = await parseBody(request, updateProviderSchema);
  const service = await getProvidersService();
  return jsonOk(await service.updateOwner(id, input));
});

/** DELETE /api/providers/:id — owner (or admin) soft-deletes. */
export const DELETE = route<Context>(async (_request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const service = await getProvidersService();
  await service.remove(id);
  return jsonNoContent();
});
