const fcfa = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("fr-FR");

const percent = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

// Fuseau explicite : le rendu a lieu sur le serveur, dont le fuseau n'est pas
// forcément celui des propriétaires. Abidjan est en UTC toute l'année.
const date = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeZone: "Africa/Abidjan",
});

const dateTime = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Abidjan",
});

const month = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

export function formatPrice(amount: number): string {
  return fcfa.format(amount);
}

export function formatNumber(value: number): string {
  return integer.format(value);
}

/** `ratio` de 0 à 1. */
export function formatPercent(ratio: number): string {
  return percent.format(ratio);
}

export function formatDate(iso: string): string {
  return date.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** Tiret pour une date absente plutôt qu'une cellule vide, qu'on lirait comme un oubli. */
export function formatOptionalDate(iso: string | null | undefined): string {
  return iso ? formatDate(iso) : "—";
}

/** `AAAA-MM` → « sept. 26 ». */
export function formatMonth(key: string): string {
  return month.format(new Date(`${key}-01T00:00:00Z`));
}
