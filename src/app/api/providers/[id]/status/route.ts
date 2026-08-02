import { requireApiRole } from "@/features/auth";
import {
  adminUpdateProviderSchema,
  getProvidersService,
} from "@/features/providers";
import { jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/**
 * PATCH /api/providers/:id/status — admin-only moderation of a provider's
 * status / featured flag / commission rate.
 */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const input = await parseBody(request, adminUpdateProviderSchema);
  const service = await getProvidersService();
  return jsonOk(await service.updateAdmin(id, input));
});
