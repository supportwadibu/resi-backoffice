"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { CommissionSettings } from "@/lib/api/types";

/** Vaut aussitôt pour les prix affichés ; une réservation prise garde sa règle. */
export async function updateCommissionSettings(settings: Omit<CommissionSettings, "updated_at">) {
  return runAction(() =>
    apiFetch<{ data: CommissionSettings }>("/admin/settings/commissions", {
      method: "PUT",
      body: settings,
    }),
  );
}
