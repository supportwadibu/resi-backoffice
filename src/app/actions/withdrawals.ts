"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { Withdrawal } from "@/lib/api/types";

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
