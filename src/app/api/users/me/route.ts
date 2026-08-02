import { requireApiUser } from "@/features/auth";
import { getUsersService, updateProfileSchema } from "@/features/users";
import { jsonOk, parseBody, route } from "@/lib/api";

/** GET /api/users/me — the current user's account + profile. */
export const GET = route(async () => {
  const user = await requireApiUser();
  const service = await getUsersService();
  return jsonOk(await service.getMe(user.id));
});

/** PATCH /api/users/me — update the current user's own profile. */
export const PATCH = route(async (request) => {
  const user = await requireApiUser();
  const input = await parseBody(request, updateProfileSchema);
  const service = await getUsersService();
  return jsonOk(await service.updateMyProfile(user.id, input));
});
