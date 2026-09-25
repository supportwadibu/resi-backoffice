"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api/client";
import {
  ACCESS_COOKIE,
  cookieOptions,
  REFRESH_COOKIE,
  type AuthTokens,
} from "@/lib/auth/tokens";

/**
 * Issue d'une tentative de connexion, affichée en toast par le formulaire.
 *
 * `warning` couvre ce que l'utilisateur peut régler lui-même ou qui relève de
 * son compte (champ manquant, compte désactivé, trop de tentatives, rôle
 * refusé) ; `error`, un échec de la tentative elle-même.
 *
 * Le succès rend la destination au lieu d'appeler `redirect()` : une
 * redirection interrompt l'action sans rien renvoyer, et le formulaire
 * n'aurait jamais l'occasion d'annoncer la connexion.
 */
export type LoginState =
  | { status: "error" | "warning"; title: string; description?: string }
  | { status: "success"; title: string; redirectTo: string }
  | undefined;

/**
 * Refus qui relèvent du compte et non de la saisie.
 *
 * Lus sur `code`, jamais sur le message : c'est la partie stable du contrat
 * de l'API.
 */
const WARNING_CODES = new Set([
  "rate_limited",
  "account_disabled",
  "account_not_verified",
  "password_not_set",
]);

export async function login(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) {
    return {
      status: "warning",
      title: "Champs manquants",
      description: "Renseignez l'identifiant et le mot de passe.",
    };
  }

  // Le user-agent du navigateur, pas celui du serveur Next.js : c'est lui qui
  // permet de reconnaître la session dans l'historique de connexion.
  const userAgent = (await headers()).get("user-agent");

  let tokens: AuthTokens;
  try {
    tokens = await apiFetch<AuthTokens>("/auth/login", {
      method: "POST",
      body: { identifier, password },
      headers: userAgent ? { "User-Agent": userAgent } : {},
      auth: false,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return WARNING_CODES.has(error.code)
        ? {
            status: "warning",
            title: "Connexion impossible",
            description: error.message,
          }
        : {
            status: "error",
            title: "Échec de la connexion",
            description: error.message,
          };
    }
    throw error;
  }

  // L'API accepte la connexion de tout rôle. La session ouverte pour un
  // non-admin est révoquée aussitôt plutôt que laissée active sans usage.
  if (tokens.user.role !== "admin") {
    await revoke(tokens.access_token, tokens.refresh_token);
    return {
      status: "warning",
      title: "Accès refusé",
      description: "Cet espace est réservé aux administrateurs.",
    };
  }

  const store = await cookies();
  store.set(
    ACCESS_COOKIE,
    tokens.access_token,
    cookieOptions(tokens.access_token),
  );
  store.set(
    REFRESH_COOKIE,
    tokens.refresh_token,
    cookieOptions(tokens.refresh_token),
  );

  return {
    status: "success",
    title: `Bienvenue, ${tokens.user.full_name}`,
    redirectTo: safeNext(formData.get("next")),
  };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const refresh = store.get(REFRESH_COOKIE)?.value;

  if (access && refresh) await revoke(access, refresh);

  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  redirect("/login");
}

/**
 * Révoque la session côté API. Un échec n'empêche pas la déconnexion locale :
 * la session expirera d'elle-même, et bloquer l'utilisateur sur une API
 * injoignable serait pire.
 */
async function revoke(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
      body: { refresh_token: refreshToken },
      headers: { Authorization: `Bearer ${accessToken}` },
      auth: false,
    });
  } catch {
    // Voir ci-dessus.
  }
}

/**
 * N'accepte qu'un chemin interne : un `next` absolu ou `//hote` ferait du
 * formulaire de connexion un redirecteur ouvert.
 */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
