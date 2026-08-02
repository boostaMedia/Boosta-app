import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createOrdersRepository } from "./repository";
import { createOrdersService, type OrdersService } from "./service";

/** Build an orders service bound to the request's Supabase client. */
export async function getOrdersService(): Promise<OrdersService> {
  const supabase = await createClient();
  return createOrdersService(createOrdersRepository(supabase));
}

export {
  createOrderSchema,
  updateOrderStatusSchema,
  listOrdersQuerySchema,
} from "./schemas";
export type { Order } from "./types";
export type { OrdersService } from "./service";
