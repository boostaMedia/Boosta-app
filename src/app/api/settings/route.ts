import { getSettingsService } from "@/features/settings";
import { jsonOk, route } from "@/lib/api";

/** GET /api/settings — public settings (RLS reveals non-public ones to admins). */
export const GET = route(async () => {
  const service = await getSettingsService();
  return jsonOk(await service.list());
});
