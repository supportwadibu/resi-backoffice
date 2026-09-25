/**
 * Préférence d'affichage (thème, barre latérale repliée) écrite depuis le
 * navigateur. Rien de sensible : le cookie reste lisible par le JavaScript
 * client, et le serveur ne s'en sert que pour rendre la bonne apparence.
 */
export function writePreferenceCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}
