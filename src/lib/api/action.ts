import "server-only";

import { refresh } from "next/cache";

import type { ActionResult } from "@/lib/action-result";

import { ApiError } from "./errors";

/**
 * Exécute une écriture vers l'API et rafraîchit la page appelante.
 *
 * Seules les `ApiError` deviennent un résultat : le `redirect()` d'un 401
 * (voir `apiFetch`) se propage par une exception que Next doit recevoir
 * intacte, tout comme une vraie panne.
 *
 * Aucun contrôle de rôle ici : l'action transmet le jeton de l'appelant, et
 * l'API refuse toute route `/admin` à un autre rôle qu'`admin`.
 */
export async function runAction<T>(
  write: () => Promise<{ data: T; message?: string }>,
): Promise<ActionResult<T>> {
  try {
    const { data, message } = await write();
    refresh();
    return { ok: true, data, message };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message, code: error.code };
    throw error;
  }
}
