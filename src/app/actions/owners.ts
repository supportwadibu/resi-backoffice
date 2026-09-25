"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { Owner, ValidateOwnerResult } from "@/lib/api/types";

export async function validateOwner(id: string) {
  return runAction(async () => {
    const result = await apiFetch<ValidateOwnerResult>(
      `/admin/owners/${encodeURIComponent(id)}/validate`,
      { method: "POST" },
    );
    return { data: result.data, message: result.message };
  });
}

export async function rejectOwner(id: string, reason: string) {
  return runAction(() =>
    apiFetch<{ data: Owner; message: string }>(`/admin/owners/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      body: { reason },
    }),
  );
}
