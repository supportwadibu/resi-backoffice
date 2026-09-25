/**
 * Thème choisi par l'utilisateur. `system` suit la préférence du système
 * d'exploitation et n'écrit aucun `data-theme`.
 *
 * Un cookie plutôt que `localStorage` : le layout racine le lit côté serveur
 * et rend d'emblée le bon thème, sans éclair clair au chargement d'une page
 * en mode sombre.
 */
export const THEME_COOKIE = "resi_theme";

export const THEMES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEMES)[number];

/** Valeur absente ou inconnue (cookie trafiqué, ancien format) : on suit le système. */
export function parseTheme(value: string | undefined): ThemePreference {
  return THEMES.includes(value as ThemePreference) ? (value as ThemePreference) : "system";
}
