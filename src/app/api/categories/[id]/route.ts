import { requireApiRole } from "@/features/auth";
import {
  getCategoriesService,
  updateCategorySchema,
} from "@/features/categories";
import { jsonNoContent, jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/categories/:id — public. */
export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const service = await getCategoriesService();
  return jsonOk(await service.get(id));
});

/** PATCH /api/categories/:id — admin only. */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const input = await parseBody(request, updateCategorySchema);
  const service = await getCategoriesService();
  return jsonOk(await service.update(id, input));
});

/** DELETE /api/categories/:id — admin only (soft delete). */
export const DELETE = route<Context>(async (_request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const service = await getCategoriesService();
  await service.remove(id);
  return jsonNoContent();
});
