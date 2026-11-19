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

/**
 * Ouvre un abonnement à un propriétaire sans paiement Wave (paiement reçu
 * hors application, geste commercial). Refusé par l'API si un abonnement
 * payant est déjà en cours : le prolonger ou le résilier d'abord.
 */
export async function grantSubscription(userId: string, planId: string, reason?: string) {
  return runAction(() =>
    apiFetch<{ data: Subscription }>("/admin/subscriptions", {
      method: "POST",
      body: reason ? { user_id: userId, plan_id: planId, reason } : { user_id: userId, plan_id: planId },
    }),
  );
}
