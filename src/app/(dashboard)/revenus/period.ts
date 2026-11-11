import type { RevenueGranularity } from "@/lib/api/types";

export const REVENUE_PERIODS = {
  semaine: "Cette semaine",
  mois: "Ce mois",
  "2mois": "Les 2 derniers mois",
  annee: "Année, mois par mois",
} as const;

export type RevenuePeriod = keyof typeof REVENUE_PERIODS;

export interface RevenueWindow {
  /** `AAAA-MM-JJ`, premier jour inclus. */
  from: string;
  /** `AAAA-MM-JJ`, dernier jour inclus. */
  to: string;
  granularity: RevenueGranularity;
}

const day = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Fenêtre d'une période, en UTC — l'heure d'Abidjan. La semaine commence le
 * lundi, comme le découpage de l'API. Une année passée se lit en entier ;
 * l'année en cours, jusqu'à aujourd'hui.
 */
export function revenueWindow(period: RevenuePeriod, year: number, now = new Date()): RevenueWindow {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  switch (period) {
    case "semaine": {
      const monday = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * 86_400_000);
      return { from: day(monday), to: day(today), granularity: "day" };
    }
    case "mois":
      return {
        from: day(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))),
        to: day(today),
        granularity: "day",
      };
    case "2mois":
      return {
        from: day(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1))),
        to: day(today),
        granularity: "week",
      };
    case "annee": {
      const end = new Date(Date.UTC(year, 11, 31));
      return { from: `${year}-01-01`, to: day(end < today ? end : today), granularity: "month" };
    }
  }
}
