/**
 * Échanges de fichiers entre le navigateur et les route handlers du
 * backoffice (exports et imports JSON).
 *
 * Client uniquement : ces fonctions manipulent `window` et `document`.
 */

/**
 * Session expirée : le handler a suivi la redirection vers `/session-expiree`
 * et rend une page HTML au lieu du JSON attendu. On y envoie le navigateur.
 */
export function redirectedToLogin(response: Response): boolean {
  if (response.redirected && !response.headers.get("content-type")?.includes("json")) {
    window.location.href = response.url;
    return true;
  }
  return false;
}

/** Message `{ message }` d'une réponse d'erreur, ou le repli donné. */
export async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? fallback;
}

/** Enregistre le corps de la réponse sous le nom de `Content-Disposition`. Rend ce nom. */
export async function saveResponse(response: Response, fallbackName: string): Promise<string> {
  const disposition = response.headers.get("content-disposition");
  const filename = disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? fallbackName;

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  return filename;
}

/** Champ de fichier des dialogues d'import, au style des autres champs. */
export const FILE_INPUT_CLASS =
  "w-full border border-border bg-background px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-surface file:px-2 file:py-1";
