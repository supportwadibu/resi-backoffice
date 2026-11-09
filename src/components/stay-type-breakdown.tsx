import { Hourglass } from "lucide-react";

import type { StayTypeBreakdown as Breakdown } from "@/lib/api/types";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { STAY_BUCKET_LABELS } from "@/lib/labels";

import { Section } from "./page-header";

/**
 * Types de séjour les plus vendus : la jauge porte la part des réservations,
 * les colonnes le chiffre d'affaires et les jours immobilisés — une tranche
 * peu fréquente peut peser lourd en revenu (les séjours au mois).
 *
 * La tranche la plus choisie est mise en avant : c'est la question posée.
 */
export function StayTypeBreakdown({ data, title }: { data: Breakdown; title?: string }) {
  const top = data.buckets.reduce<Breakdown["buckets"][number] | null>(
    (best, bucket) => (bucket.bookings > (best?.bookings ?? 0) ? bucket : best),
    null,
  );

  const period =
    data.months !== null
      ? `${data.months} derniers mois`
      : `du ${formatDate(data.from)} au ${formatDate(data.to ?? data.from)}`;

  return (
    <Section title={title ?? `Types de séjour · ${period}`} icon={Hourglass}>
      <p className="mb-4 text-sm text-muted">
        {data.total_bookings === 0
          ? "Aucune réservation commencée sur la période."
          : `${formatNumber(data.total_bookings)} réservation${data.total_bookings > 1 ? "s" : ""} non annulée${data.total_bookings > 1 ? "s" : ""}, comptée${data.total_bookings > 1 ? "s" : ""} au mois d'arrivée · le plus choisi : ${top ? STAY_BUCKET_LABELS[top.key] : "—"}.`}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-lg text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="py-2 pr-4 font-normal">Séjour</th>
              <th className="py-2 pr-4 font-normal">Réservations</th>
              <th className="py-2 pr-4 text-right font-normal">Chiffre d&apos;affaires</th>
              <th className="py-2 text-right font-normal">Jours occupés</th>
            </tr>
          </thead>
          <tbody>
            {data.buckets.map((bucket) => (
              <tr key={bucket.key} className="border-b border-border last:border-0">
                <td className={`py-2 pr-4 ${bucket.key === top?.key ? "font-semibold" : ""}`}>
                  {STAY_BUCKET_LABELS[bucket.key]}
                </td>
                <td className="w-2/5 py-2 pr-4">
                  <div className="flex items-baseline justify-between gap-2 tabular-nums">
                    <span>{formatNumber(bucket.bookings)}</span>
                    <span className="text-muted">{bucket.share_percent.toString().replace(".", ",")} %</span>
                  </div>
                  <div aria-hidden className="mt-1 h-1 bg-background">
                    <div className="h-full bg-primary" style={{ width: `${bucket.share_percent}%` }} />
                  </div>
                </td>
                <td className="py-2 pr-4 text-right whitespace-nowrap tabular-nums">{formatPrice(bucket.revenue)}</td>
                <td className="py-2 text-right tabular-nums">{formatNumber(bucket.occupancy_days)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
