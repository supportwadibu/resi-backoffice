"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { Feedback, FeedbackStatus } from "@/lib/api/types";

export async function updateFeedback(
  id: string,
  input: { status?: FeedbackStatus; admin_note?: string | null },
) {
  return runAction(() =>
    apiFetch<{ data: Feedback }>(`/admin/feedbacks/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: input,
    }),
  );
}
