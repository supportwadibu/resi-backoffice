"use server";

import { runAction } from "@/lib/api/action";
import { apiFetch } from "@/lib/api/client";
import type { RoleName, User } from "@/lib/api/types";

export interface UserPatch {
  full_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

/** Désactiver un compte révoque aussi ses sessions ; leur nombre revient dans le message. */
export async function updateUser(id: string, patch: UserPatch) {
  return runAction(async () => {
    const result = await apiFetch<{ data: User; revoked_sessions: number }>(
      `/admin/users/${encodeURIComponent(id)}`,
      { method: "PATCH", body: patch },
    );
    const revoked = result.revoked_sessions;
    return {
      data: result.data,
      message:
        revoked > 0
          ? `${revoked} session${revoked > 1 ? "s" : ""} fermée${revoked > 1 ? "s" : ""}.`
          : undefined,
    };
  });
}

export interface CreateUserInput {
  role: RoleName;
  full_name: string;
  email?: string;
  phone?: string;
  /** Mot de passe initial, que le titulaire changera depuis son profil. */
  password: string;
  /** Rôle `gerant` : propriétaire pour lequel il agit. */
  owner_id?: string;
}

/** Compte vérifié d'office : l'API n'envoie pas d'OTP pour une création par un admin. */
export async function createUser(input: CreateUserInput) {
  return runAction(async () => {
    const { data } = await apiFetch<{ data: User }>("/admin/users", {
      method: "POST",
      body: input,
    });
    return { data };
  });
}
