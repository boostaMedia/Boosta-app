import { NotFoundError } from "@/lib/errors";

import type { SubscriptionsRepository } from "./repository";
import type {
  BillingInterval,
  CreateSubscriptionInput,
  ProviderPackage,
  Subscription,
  UpdateSubscriptionInput,
} from "./types";

/** Compute the end of a billing period starting now. */
export function periodEndFrom(
  interval: BillingInterval,
  from = new Date(),
): Date {
  const end = new Date(from);
  if (interval === "monthly") end.setMonth(end.getMonth() + 1);
  else if (interval === "quarterly") end.setMonth(end.getMonth() + 3);
  else end.setFullYear(end.getFullYear() + 1); // yearly
  return end;
}

export interface SubscriptionsService {
  listPackages(): Promise<ProviderPackage[]>;
  listMine(): Promise<Subscription[]>;
  subscribe(
    providerId: string,
    input: CreateSubscriptionInput,
  ): Promise<Subscription>;
  update(id: string, input: UpdateSubscriptionInput): Promise<Subscription>;
}

export function createSubscriptionsService(
  repo: SubscriptionsRepository,
): SubscriptionsService {
  return {
    async listPackages() {
      return repo.listPackages();
    },

    async listMine() {
      return repo.listSubscriptions();
    },

    async subscribe(providerId, input) {
      const plan = await repo.findPackage(input.packageId);
      if (!plan) throw new NotFoundError("Subscription package not found.");

      const currentPeriodEnd = periodEndFrom(
        plan.billingInterval,
      ).toISOString();
      return repo.create(providerId, {
        packageId: input.packageId,
        currentPeriodEnd,
        autoRenew: input.autoRenew,
      });
    },

    async update(id, input) {
      const patch: {
        autoRenew?: boolean;
        status?: string;
        cancelledAt?: string;
      } = {};
      if (input.autoRenew !== undefined) patch.autoRenew = input.autoRenew;
      if (input.cancel) {
        patch.status = "cancelled";
        patch.cancelledAt = new Date().toISOString();
        patch.autoRenew = false;
      }

      const updated = await repo.update(id, patch);
      if (!updated) throw new NotFoundError("Subscription not found.");
      return updated;
    },
  };
}
