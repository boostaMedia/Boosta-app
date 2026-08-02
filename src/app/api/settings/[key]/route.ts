import { requireApiRole } from "@/features/auth";
import {
  getSettingsService,
  settingKeySchema,
  upsertSettingSchema,
} from "@/features/settings";
import { jsonOk, parseBody, route } from "@/lib/api";
import { ValidationError } from "@/lib/errors";

type Context = { params: Promise<{ key: string }> };

function validKey(key: string): string {
  const result = settingKeySchema.safeParse(key);
  if (!result.success) throw new ValidationError("Invalid setting key.");
  return result.data;
}

/** GET /api/settings/:key — public (subject to RLS on non-public settings). */
export const GET = route<Context>(async (_request, { params }) => {
  const { key } = await params;
  const service = await getSettingsService();
  return jsonOk(await service.get(validKey(key)));
});

/** PUT /api/settings/:key — admin upsert. */
export const PUT = route<Context>(async (request, { params }) => {
  await requireApiRole("admin");
  const { key } = await params;
  const input = await parseBody(request, upsertSettingSchema);
  const service = await getSettingsService();
  return jsonOk(await service.upsert(validKey(key), input));
});
