/**
 * Erreur renvoyée par l'API, au format `{ code, message }` de son handler.
 *
 * `code` est stable et sert à distinguer une cause ; `message` est en français
 * et peut s'afficher tel quel.
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const UNREACHABLE = new ApiError(
  "api_unreachable",
  "Le serveur est injoignable. Réessayez dans un instant.",
  503,
);

export async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as {
    code?: string;
    message?: string;
    errors?: { message?: string }[];
  } | null;

  // Les erreurs de validation VineJS n'ont pas de `code` : elles portent une
  // liste `errors` dont le premier message suffit à l'affichage.
  const message =
    body?.message ??
    body?.errors?.[0]?.message ??
    "Une erreur inattendue est survenue.";

  return new ApiError(body?.code ?? `http_${response.status}`, message, response.status);
}
