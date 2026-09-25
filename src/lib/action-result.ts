/**
 * Issue d'une server action, renvoyée plutôt que levée : en production, Next
 * remplace le message d'une erreur levée côté serveur par un texte générique
 * en anglais, et l'administrateur perdrait le message de l'API.
 *
 * Module sans `server-only` : les composants clients en lisent le type et
 * s'appuient sur `expectOk`.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; code: string };

/**
 * Relève l'échec d'une action en exception, côté client, pour `ConfirmDialog`
 * qui affiche le message de l'erreur levée par son `onConfirm`.
 */
export function expectOk<T>(result: ActionResult<T>): Extract<ActionResult<T>, { ok: true }> {
  if (!result.ok) throw new Error(result.error);
  return result;
}
