"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { Subscription } from "@/lib/api/types";

export async function cancelSubscription(id: string, reason?: string) {
  return runAction(() =>
    apiFetch<{ data: Subscription }>(`/admin/subscriptions/${encodeURIComponent(id)}/cancel`, {
      method: "PATCH",
      body: reason ? { reason } : {},
    }),
  );
}
