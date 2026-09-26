"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { Plan, PlanTier } from "@/lib/api/types";

export interface PlanInput {
  name: string;
  description: string;
  price: number;
  duration_days: number;
  max_residences: number;
  features: string[];
  tier: PlanTier;
  is_active: boolean;
}

export async function createPlan(input: PlanInput) {
  return runAction(() =>
    apiFetch<{ data: Plan }>("/admin/plans", { method: "POST", body: input }),
  );
}

export async function updatePlan(id: string, input: Partial<PlanInput>) {
  return runAction(() =>
    apiFetch<{ data: Plan }>(`/admin/plans/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: input,
    }),
  );
}

export async function deletePlan(id: string) {
  return runAction(async () => {
    await apiFetch(`/admin/plans/${encodeURIComponent(id)}`, { method: "DELETE" });
    return { data: undefined };
  });
}
