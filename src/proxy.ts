import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  cookieOptions,
  decodeClaims,
  isUsable,
  REFRESH_COOKIE,
  type AuthTokens,
} from "@/lib/auth/tokens";

/**
 * Garde d'accès et rafraîchissement du jeton, avant tout rendu.
 *
 * Le rafraîchissement vit ici parce que c'est le seul endroit, avant le rendu,
 * où l'on peut à la fois écrire les cookies du navigateur et transmettre le
 * nouveau jeton aux composants serveur de la même requête.
 *
 * Ce contrôle ne dispense pas l'API du sien : elle vérifie la signature et le
 * rôle à chaque appel. Le proxy évite seulement d'afficher un écran vide.
 */
export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (isUsable(access)) {
    return isAdmin(access!) ? NextResponse.next() : expire(request);
  }
  if (!refresh) return toLogin(request);

  const result = await refreshOnce(refresh);
  // API injoignable : ce n'est pas une raison de déconnecter. La page
  // s'affichera en erreur et le prochain chargement retentera.
  if (result === "unreachable") return NextResponse.next();
  if (!result || !isAdmin(result.access_token)) return expire(request);

  request.cookies.set(ACCESS_COOKIE, result.access_token);
  request.cookies.set(REFRESH_COOKIE, result.refresh_token);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(ACCESS_COOKIE, result.access_token, cookieOptions(result.access_token));
  response.cookies.set(REFRESH_COOKIE, result.refresh_token, cookieOptions(result.refresh_token));
  return response;
}

export const config = {
  // `/login` et `/session-expiree` restent publics. Les fichiers de `public/`
  // (tout chemin à extension) aussi : l'optimiseur d'images les télécharge
  // sans cookie, et une redirection vers `/login` lui ferait renvoyer un 400.
  matcher: ["/((?!_next/static|_next/image|login|session-expiree|.*\\.[a-zA-Z0-9]+$).*)"],
};

function isAdmin(accessToken: string): boolean {
  return decodeClaims(accessToken)?.role === "admin";
}

function toLogin(request: NextRequest) {
  const url = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

function expire(request: NextRequest) {
  return NextResponse.redirect(new URL("/session-expiree", request.url));
}

type RefreshResult = AuthTokens | null | "unreachable";

/**
 * L'API fait tourner le refresh token : un token ne sert qu'une fois, et un
 * second rafraîchissement concurrent est rejeté. Or le navigateur envoie
 * plusieurs requêtes à la fois (page, préchargements) portant le même
 * cookie. Sans ce partage, la deuxième déconnecterait l'utilisateur.
 *
 * Le résultat reste disponible quelques secondes pour les requêtes parties
 * avant que le navigateur ait reçu les nouveaux cookies. Mémoire du processus :
 * valable pour un serveur Node unique, pas pour plusieurs instances.
 */
const inflight = new Map<string, Promise<RefreshResult>>();
const SHARE_WINDOW_MS = 10_000;

function refreshOnce(refreshToken: string): Promise<RefreshResult> {
  let pending = inflight.get(refreshToken);
  if (!pending) {
    pending = callRefresh(refreshToken);
    inflight.set(refreshToken, pending);
    setTimeout(() => inflight.delete(refreshToken), SHARE_WINDOW_MS);
  }
  return pending;
}

async function callRefresh(refreshToken: string): Promise<RefreshResult> {
  const apiUrl = process.env.API_URL?.replace(/\/+$/, "");
  if (!apiUrl) throw new Error("API_URL manquante : voir .env.example.");

  try {
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Platform": "web",
        "X-Device-Name": "backoffice",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (response.status >= 500) return "unreachable";
    if (!response.ok) return null;
    return (await response.json()) as AuthTokens;
  } catch {
    return "unreachable";
  }
}
