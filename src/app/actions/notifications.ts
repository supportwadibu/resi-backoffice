"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { NotificationAudience, NotificationCampaign } from "@/lib/api/types";

/** Envoie une notification push aux propriétaires, tous ou choisis. */
export async function sendNotification(input: {
  title: string;
  body: string;
  audience: NotificationAudience;
  owner_ids: string[];
}) {
  return runAction(async () => {
    const { data } = await apiFetch<{ data: NotificationCampaign }>("/admin/notifications", {
      method: "POST",
      body: input.audience === "all_owners" ? { ...input, owner_ids: undefined } : input,
    });
    return {
      data,
      message: `Envoyée à ${data.devices_sent} appareil${data.devices_sent > 1 ? "s" : ""} (${data.recipients_count} propriétaire${data.recipients_count > 1 ? "s" : ""}).`,
    };
  });
}
