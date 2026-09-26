"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { Subscription } from "@/lib/api/types";

/** Repousse l'échéance d'un abonnement en cours, sans paiement. */
export async function extendSubscription(id: string, days: number, reason?: string) {
  return runAction(() =>
    apiFetch<{ data: Subscription }>(`/admin/subscriptions/${encodeURIComponent(id)}/extend`, {
      method: "PATCH",
      body: reason ? { days, reason } : { days },
    }),
  );
}

export async function cancelSubscription(id: string, reason?: string) {
  return runAction(() =>
    apiFetch<{ data: Subscription }>(`/admin/subscriptions/${encodeURIComponent(id)}/cancel`, {
      method: "PATCH",
      body: reason ? { reason } : {},
    }),
  );
}
