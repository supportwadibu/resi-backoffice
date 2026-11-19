"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { ManualPaymentMethod, Subscription, SubscriptionGrantCode } from "@/lib/api/types";

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

/** Ce qu'un administrateur enregistre : le code reçu par e-mail en plus. */
export interface SubscriptionGrantInput {
  user_id: string;
  plan_id: string;
  amount: number;
  payment_method: ManualPaymentMethod;
  payment_reference?: string;
  note?: string;
}

/**
 * Envoie à l'e-mail de l'administrateur le code qui validera
 * l'enregistrement. Le code ne vaut que pour ce propriétaire, ce forfait et
 * ce montant. Pas de rafraîchissement : rien n'a changé côté données.
 */
export async function requestSubscriptionGrantCode(
  input: Pick<SubscriptionGrantInput, "user_id" | "plan_id" | "amount">,
) {
  return runAction(
    () =>
      apiFetch<{ data: SubscriptionGrantCode }>("/admin/subscriptions/code", {
        method: "POST",
        body: input,
      }),
    { refresh: false },
  );
}

/**
 * Enregistre l'abonnement d'un propriétaire sans paiement dans l'application
 * (espèces, virement, geste commercial). Le montant est enregistré comme un
 * paiement ; refusé par l'API si un abonnement payant est déjà en cours.
 */
export async function grantSubscription(input: SubscriptionGrantInput & { code: string }) {
  return runAction(() =>
    apiFetch<{ data: Subscription }>("/admin/subscriptions", {
      method: "POST",
      body: {
        ...input,
        payment_reference: input.payment_reference || undefined,
        note: input.note || undefined,
      },
    }),
  );
}
