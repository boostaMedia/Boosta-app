"use server";

import { revalidatePath } from "next/cache";

import { requireCustomer, requireUser } from "@/features/auth";
import {
  getCurrentProviderId,
  getProvidersService,
} from "@/features/providers";
import { getServicesService } from "@/features/services";
import { NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";

import { getOrdersService } from "./index";
import { canTransition } from "./transitions";
import type { OrderActor } from "./transitions";
import type { OrderStatus } from "./types";

const log = logger.child({ module: "orders" });

export type CreateBookingResult =
  | { ok: true; orderId: string }
  | {
      ok: false;
      error: "invalid_time" | "unavailable" | "failed";
    };

/**
 * Place a booking request for a service. The price and currency come from the
 * service row on the server, never from the client, and only active services
 * of verified providers can be booked. The order starts as 'pending' — the
 * provider has to accept it. Payment isn't collected yet.
 */
export async function createBookingAction(input: {
  serviceId: string;
  scheduledAt?: string;
  notes?: string;
}): Promise<CreateBookingResult> {
  const user = await requireCustomer();

  let scheduledAt: string | undefined;
  if (input.scheduledAt) {
    const when = new Date(input.scheduledAt);
    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      return { ok: false, error: "invalid_time" };
    }
    scheduledAt = when.toISOString();
  }

  try {
    const services = await getServicesService();
    const service = await services.get(input.serviceId);
    if (service.status !== "active") return { ok: false, error: "unavailable" };

    const providers = await getProvidersService();
    const provider = await providers.get(service.providerId);
    if (provider.status !== "verified") {
      return { ok: false, error: "unavailable" };
    }

    const orders = await getOrdersService();
    const order = await orders.create(user.id, {
      providerId: provider.id,
      serviceId: service.id,
      subtotal: service.basePrice,
      discountAmount: 0,
      taxAmount: 0,
      currency: service.currency,
      scheduledAt,
      notes: input.notes?.trim() || undefined,
    });

    revalidatePath("/bookings");
    revalidatePath("/dashboard/bookings");
    return { ok: true, orderId: order.id };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: "unavailable" };
    }
    log.warn("create_booking.failed", { error });
    return { ok: false, error: "failed" };
  }
}

export type UpdateBookingStatusResult =
  { ok: true } | { ok: false; error: "not_allowed" | "not_found" | "failed" };

/**
 * Move a booking to a new status as whichever side of it the caller is. The
 * allowed moves live in `canTransition`, so a customer can withdraw but never
 * mark their own booking completed, and a provider can't skip steps.
 */
export async function updateBookingStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<UpdateBookingStatusResult> {
  const user = await requireUser();

  try {
    const orders = await getOrdersService();
    const order = await orders.get(orderId);

    let actor: OrderActor | null = null;
    if (order.customerId === user.id) {
      actor = "customer";
    } else if (
      user.role === "provider" &&
      (await getCurrentProviderId()) === order.providerId
    ) {
      actor = "provider";
    }

    if (!actor || !canTransition(actor, order.status, status)) {
      return { ok: false, error: "not_allowed" };
    }

    await orders.updateStatus(orderId, {
      status,
      cancelledReason:
        status === "cancelled"
          ? actor === "customer"
            ? "Cancelled by customer"
            : "Declined by provider"
          : undefined,
    });

    revalidatePath("/bookings");
    revalidatePath("/dashboard/bookings");
    return { ok: true };
  } catch (error) {
    if (error instanceof NotFoundError)
      return { ok: false, error: "not_found" };
    log.warn("update_booking_status.failed", { error, orderId, status });
    return { ok: false, error: "failed" };
  }
}
