"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { Withdrawal, WithdrawalSettings } from "@/lib/api/types";

/** Le transfert Wave est fait : la demande est close, le portefeuille reste débité. */
export async function markWithdrawalPaid(id: string, payoutReference?: string) {
  return runAction(() =>
    apiFetch<{ data: Withdrawal }>(`/admin/withdrawals/${encodeURIComponent(id)}/paid`, {
      method: "PATCH",
      body: payoutReference ? { payout_reference: payoutReference } : {},
    }),
  );
}

/** Refus motivé : le montant revient au portefeuille du propriétaire. */
export async function rejectWithdrawal(id: string, rejectionReason: string) {
  return runAction(() =>
    apiFetch<{ data: Withdrawal }>(`/admin/withdrawals/${encodeURIComponent(id)}/reject`, {
      method: "PATCH",
      body: { rejection_reason: rejectionReason },
    }),
  );
}

/** Retrait minimal : vaut pour les demandes suivantes, pas pour celles en attente. */
export async function updateWithdrawalSettings(minimumAmount: number) {
  return runAction(() =>
    apiFetch<{ data: WithdrawalSettings }>("/admin/settings/withdrawals", {
      method: "PUT",
      body: { minimum_amount: minimumAmount },
    }),
  );
}
