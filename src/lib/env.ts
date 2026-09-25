import "server-only";

/**
 * Lue à l'appel plutôt qu'au chargement du module : `next build` importe les
 * modules sans que l'environnement d'exécution soit forcément fourni.
 */
export function apiUrl(): string {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error("API_URL manquante : voir .env.example.");
  }
  return url.replace(/\/+$/, "");
}
