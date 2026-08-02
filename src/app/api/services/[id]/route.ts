import { requireApiUser } from "@/features/auth";
import { getServicesService, updateServiceSchema } from "@/features/services";
import { jsonNoContent, jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/services/:id — public. */
export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const service = await getServicesService();
  return jsonOk(await service.get(id));
});

/** PATCH /api/services/:id — owner (or admin) edits. RLS enforces ownership. */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const input = await parseBody(request, updateServiceSchema);
  const service = await getServicesService();
  return jsonOk(await service.update(id, input));
});

/** DELETE /api/services/:id — owner (or admin) soft-deletes. */
export const DELETE = route<Context>(async (_request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const service = await getServicesService();
  await service.remove(id);
  return jsonNoContent();
});
