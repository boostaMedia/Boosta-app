import { requireApiRole } from "@/features/auth";
import { adminUpdateUserSchema, getUsersService } from "@/features/users";
import { jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/users/:id — admin-only. */
export const GET = route<Context>(async (_request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const service = await getUsersService();
  return jsonOk(await service.get(id));
});

/** PATCH /api/users/:id — admin-only role/status/verification update. */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const input = await parseBody(request, adminUpdateUserSchema);
  const service = await getUsersService();
  return jsonOk(await service.adminUpdate(id, input));
});
