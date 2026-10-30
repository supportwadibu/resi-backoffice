"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type {
  Sponsorship,
  SponsorshipRedemption,
  SponsorshipSettings,
} from "@/lib/api/types";

/** Annule le gain d'un filleul ; déjà disponible, il est repris sur le solde du parrain. */
export async function cancelSponsorship(id: string, reason: string) {
  return runAction(() =>
    apiFetch<{ data: Sponsorship }>(`/admin/sponsorships/${encodeURIComponent(id)}/cancel`, {
      method: "PATCH",
      body: { reason },
    }),
  );
}

/** Le transfert Wave est fait : la demande est close, les gains restent débités. */
export async function markRedemptionPaid(id: string, payoutReference?: string) {
  return runAction(() =>
    apiFetch<{ data: SponsorshipRedemption }>(
      `/admin/sponsorship-redemptions/${encodeURIComponent(id)}/paid`,
      { method: "PATCH", body: payoutReference ? { payout_reference: payoutReference } : {} },
    ),
  );
}

/** Refus motivé : le montant revient aux gains du parrain. */
export async function rejectRedemption(id: string, rejectionReason: string) {
  return runAction(() =>
    apiFetch<{ data: SponsorshipRedemption }>(
      `/admin/sponsorship-redemptions/${encodeURIComponent(id)}/reject`,
      { method: "PATCH", body: { rejection_reason: rejectionReason } },
    ),
  );
}

/** Remplace les réglages en entier : valent pour les gains à venir, pas pour ceux acquis. */
export async function updateSponsorshipSettings(
  settings: Omit<SponsorshipSettings, "updated_at">,
) {
  return runAction(() =>
    apiFetch<{ data: SponsorshipSettings }>("/admin/settings/sponsorships", {
      method: "PUT",
      body: settings,
    }),
  );
}
