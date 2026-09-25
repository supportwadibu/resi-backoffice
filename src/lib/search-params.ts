/**
 * Lecture des paramètres d'URL des listes.
 *
 * Une valeur hors liste est ignorée plutôt que transmise : l'API répondrait
 * 422 et la page tomberait en erreur pour une URL retouchée à la main.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

/** Première valeur, sans espaces ; une chaîne vide vaut absence (champ de filtre laissé vide). */
export function param(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value ? value : undefined;
}

export function enumParam<T extends string>(
  params: SearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = param(params, key);
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export function boolParam(params: SearchParams, key: string): boolean | undefined {
  const value = param(params, key);
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function pageParam(params: SearchParams): number {
  const page = Number(param(params, "page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/** Paramètres conservés d'une page à l'autre de la pagination. */
export function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
