import "server-only";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/tokens";
import { apiUrl } from "@/lib/env";

import { ApiError, toApiError, UNREACHABLE } from "./errors";

/**
 * Identifie le backoffice auprès de l'API, qui l'enregistre dans le contexte
 * d'appareil de chaque session (`X-Platform`, `X-Device-Name`).
 */
const DEVICE_HEADERS = {
  "X-Platform": "web",
  "X-Device-Name": "backoffice",
};

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  /** Faux pour les routes publiques (`/auth/login`, `/auth/refresh`). */
  auth?: boolean;
}

/**
 * Appel à l'API depuis le serveur Next.js.
 *
 * Le rafraîchissement du jeton n'a pas lieu ici : un composant serveur ne
 * peut pas écrire de cookie, c'est le proxy qui s'en charge avant le rendu.
 * Un 401 malgré tout (session révoquée côté API) renvoie vers
 * `/session-expiree`, qui efface les cookies — rediriger directement vers
 * `/login` laisserait un jeton mort dans le navigateur.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, headers = {}, auth = true } = options;

  const url = new URL(apiUrl() + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...DEVICE_HEADERS,
    ...headers,
  };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";

  if (auth) {
    const store = await cookies();
    const token = store.get(ACCESS_COOKIE)?.value;
    if (!token) {
      // Refresh token présent mais pas de jeton d'accès : le proxy n'a pas pu
      // joindre l'API pour rafraîchir. La session reste bonne, on n'efface rien.
      if (store.has(REFRESH_COOKIE)) throw UNREACHABLE;
      redirect("/session-expiree");
    }
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw UNREACHABLE;
  }

  if (auth && response.status === 401) redirect("/session-expiree");
  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

/**
 * Lecture d'une fiche : un 404 de l'API rend la page « introuvable » de Next
 * plutôt que l'écran d'erreur générique, qui inviterait à réessayer en vain.
 */
export async function apiFetchOrNotFound<T>(path: string, options?: RequestOptions): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export { ApiError };
