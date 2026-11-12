"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export interface ProfilePatch {
  full_name?: string;
  email?: string;
  /** `null` retire le numéro. */
  phone?: string | null;
  /** Exigé par l'API pour changer l'e-mail, le téléphone ou le mot de passe. */
  current_password?: string;
  new_password?: string;
}

/**
 * Compte de l'administrateur connecté. Un nouveau mot de passe ferme ses
 * autres sessions, pas celle-ci : leur nombre revient dans le message.
 */
export async function updateProfile(patch: ProfilePatch) {
  return runAction(async () => {
    const result = await apiFetch<{ data: User; revoked_sessions: number }>("/admin/profile", {
      method: "PATCH",
      body: patch,
    });
    const revoked = result.revoked_sessions;
    return {
      data: result.data,
      message:
        revoked > 0
          ? `${revoked} autre${revoked > 1 ? "s" : ""} session${revoked > 1 ? "s" : ""} fermée${revoked > 1 ? "s" : ""}.`
          : undefined,
    };
  });
}
