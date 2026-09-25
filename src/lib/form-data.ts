/** Lecture d'un champ texte de `FormData`, sans espaces autour. */
export function text(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

/** Nombre saisi, `null` pour un champ vide ou illisible. La virgule décimale est acceptée. */
export function number(form: FormData, name: string): number | null {
  const raw = text(form, name).replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
