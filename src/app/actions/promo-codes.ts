"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { PromoCode, PromoCodeType } from "@/lib/api/types";

/**
 * `null` efface une borne ou une limite ; l'API distingue `null` (effacer)
 * d'un champ absent (laisser en place).
 */
export interface PromoCodeInput {
  type: PromoCodeType;
  value: number;
  min_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number;
  /** Horodatage ISO 8601. */
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export async function createPromoCode(input: PromoCodeInput & { code: string }) {
  return runAction(() =>
    apiFetch<{ data: PromoCode }>("/admin/promo-codes", { method: "POST", body: input }),
  );
}

/** Le code lui-même est immuable : il sert d'identifiant au document. */
export async function updatePromoCode(id: string, input: PromoCodeInput) {
  return runAction(() =>
    apiFetch<{ data: PromoCode }>(`/admin/promo-codes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: input,
    }),
  );
}

export async function deletePromoCode(id: string) {
  return runAction(async () => {
    await apiFetch(`/admin/promo-codes/${encodeURIComponent(id)}`, { method: "DELETE" });
    return { data: undefined };
  });
}
