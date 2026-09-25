import "server-only";

import { cache } from "react";

import { apiFetch } from "@/lib/api/client";

import type { SessionUser } from "./tokens";

/**
 * Utilisateur connecté, tel que l'API le voit.
 *
 * Mis en cache pour la durée d'une requête : le layout et la page le
 * demandent tous deux, un seul appel à `/auth/me` suffit.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser> => {
  const { user } = await apiFetch<{ user: SessionUser }>("/auth/me");
  return user;
});
