/**
 * Jetons de l'API et cookies qui les portent.
 *
 * Sans `server-only` : le proxy importe ce module. Il ne contient aucun
 * secret — la signature des jetons n'est jamais vérifiée ici, c'est le rôle
 * de l'API.
 */

export const ACCESS_COOKIE = "resi_access";
export const REFRESH_COOKIE = "resi_refresh";

/** Réponse de `/auth/login` et `/auth/refresh`. */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: SessionUser;
}

export interface SessionUser {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_verified: boolean;
}

interface JwtClaims {
  exp?: number;
  role?: string;
}

/**
 * Lit les claims d'un JWT sans en vérifier la signature.
 *
 * Suffisant pour décider quand rafraîchir ou quoi afficher : un jeton forgé
 * passerait ce décodage mais serait refusé par l'API au premier appel.
 */
export function decodeClaims(token: string): JwtClaims | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/**
 * Marge avant expiration : un jeton qui expire pendant le rendu ferait échouer
 * les appels de fin de page, alors qu'il était valide en entrant.
 */
const EXPIRY_MARGIN_SECONDS = 30;

export function isUsable(token: string | undefined): boolean {
  if (!token) return false;
  const exp = decodeClaims(token)?.exp;
  if (!exp) return false;
  return exp - EXPIRY_MARGIN_SECONDS > Date.now() / 1000;
}

/** Durée de vie du cookie calée sur celle du jeton qu'il porte. */
function maxAgeOf(token: string): number | undefined {
  const exp = decodeClaims(token)?.exp;
  return exp ? Math.max(0, Math.floor(exp - Date.now() / 1000)) : undefined;
}

export function cookieOptions(token: string) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeOf(token),
  };
}
