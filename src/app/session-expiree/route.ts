import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/tokens";

/**
 * Point de sortie d'une session refusée par l'API.
 *
 * Route handler et non page : seul un handler (ou une action) peut effacer
 * les cookies, et un rendu de page ne le peut pas.
 */
export async function GET() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  redirect("/login?expiree=1");
}
