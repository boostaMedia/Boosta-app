"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth";
import { logger } from "@/lib/logger";

import { getUsersService } from "./index";
import { updateProfileSchema } from "./schemas";

const log = logger.child({ module: "users" });

export type SetCountryResult = { ok: true } | { ok: false };

/** Set the signed-in user's home country (drives default search scope). */
export async function setMyCountryAction(
  countryId: string,
): Promise<SetCountryResult> {
  const user = await requireUser();

  const parsed = updateProfileSchema.safeParse({ countryId });
  if (!parsed.success) return { ok: false };

  try {
    const users = await getUsersService();
    await users.updateMyProfile(user.id, parsed.data);
    revalidatePath("/account");
    revalidatePath("/search");
    return { ok: true };
  } catch (error) {
    log.warn("set_country.failed", { error });
    return { ok: false };
  }
}
