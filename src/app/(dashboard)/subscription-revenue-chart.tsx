"use client";

import { useState } from "react";

import { formatMonth, formatNumber, formatPrice } from "@/lib/format";

const HEIGHT = 200;

/** Un mois du graphique : encaissé, et renouvellements encore attendus. */
export interface RevenueMonth {
  month: string;
  earned: number;
  payments: number;
  expected: number;
  renewals: number;
}

/**
 * Revenu d'abonnement mois par mois : l'encaissé en colonne pleine, l'attendu
 * en colonne claire bordée au-dessus. Le mois en cours porte les deux —
 * l'argent déjà reçu, et les renouvellements qui restent à venir d'ici sa fin.
 *
 * Deux séries seulement, distinguées par le remplissage et non par une seconde
 * teinte : la légende les nomme une fois. Chaque colonne est focalisable et
 * porte ses valeurs dans son libellé ; le tableau repliable les rend lisibles
 * sans survol.
 */
export function SubscriptionRevenueChart({ data }: { data: RevenueMonth[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((point) => point.earned + point.expected), 0);
  const top = niceCeil(max);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="block size-3 bg-accent-green" />
          Encaissé
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="block size-3 border border-accent-green bg-accent-green-soft" />
          Attendu si les abonnés renouvellent
        </span>
      </div>

      <div className="flex gap-3">
        <div
          aria-hidden
          className="flex flex-col justify-between text-right text-xs text-muted tabular-nums"
          style={{ height: HEIGHT }}
        >
          <span>{compact(top)}</span>
          <span>{compact(top / 2)}</span>
          <span>0</span>
        </div>

        <div className="relative min-w-0 flex-1">
          <div aria-hidden className="absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: HEIGHT }}>
            <div className="border-t border-dashed border-border" />
            <div className="border-t border-dashed border-border" />
            <div className="border-t border-border" />
          </div>

          <ol className="relative flex items-end" style={{ height: HEIGHT }}>
            {data.map((point, index) => {
              const earnedRatio = top > 0 ? point.earned / top : 0;
              const expectedRatio = top > 0 ? point.expected / top : 0;
              const label = `${formatMonth(point.month)} : ${formatPrice(point.earned)} encaissés${
                point.expected > 0 ? `, ${formatPrice(point.expected)} attendus` : ""
              }`;
              const dimmed = active !== null && active !== index ? "opacity-50" : "";

              return (
                <li key={point.month} className="relative flex h-full flex-1 justify-center">
                  <button
                    type="button"
                    aria-label={label}
                    onPointerEnter={() => setActive(index)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    className="flex h-full w-full flex-col items-center justify-end outline-none focus-visible:bg-background"
                  >
                    {point.expected > 0 && (
                      <span
                        className={`block w-full max-w-6 border border-accent-green bg-accent-green-soft transition-opacity ${dimmed}`}
                        style={{ height: `${expectedRatio * 100}%`, minHeight: 2 }}
                      />
                    )}
                    {point.earned > 0 && (
                      <span
                        className={`block w-full max-w-6 bg-accent-green transition-opacity ${dimmed}`}
                        style={{ height: `${earnedRatio * 100}%`, minHeight: 2 }}
                      />
                    )}
                  </button>

                  {active === index && (
                    <div
                      role="presentation"
                      className={`pointer-events-none absolute z-10 border border-border bg-surface px-3 py-2 text-xs shadow-lg ${
                        index > data.length / 2 ? "right-0" : "left-0"
                      }`}
                      style={{ bottom: `calc(${Math.min(earnedRatio + expectedRatio, 0.85) * 100}% + 8px)` }}
                    >
                      <div className="font-medium whitespace-nowrap">{formatMonth(point.month)}</div>
                      {(point.earned > 0 || point.expected === 0) && (
                        <div className="whitespace-nowrap tabular-nums">
                          {formatPrice(point.earned)} encaissés · {formatNumber(point.payments)} paiement
                          {point.payments > 1 ? "s" : ""}
                        </div>
                      )}
                      {point.expected > 0 && (
                        <div className="whitespace-nowrap text-muted tabular-nums">
                          {formatPrice(point.expected)} attendus · {formatNumber(point.renewals)} renouvellement
                          {point.renewals > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <ol aria-hidden className="mt-2 flex text-xs text-muted">
            {data.map((point, index) => (
              <li key={point.month} className="flex-1 text-center">
                <span className={index % 2 === 0 ? "" : "max-sm:invisible"}>{formatMonth(point.month)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted hover:text-foreground">Voir le tableau</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 font-medium">Mois</th>
              <th scope="col" className="py-1 text-right font-medium">Encaissé</th>
              <th scope="col" className="py-1 text-right font-medium">Attendu</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((point) => (
              <tr key={point.month} className="border-t border-border">
                <td className="py-1">{formatMonth(point.month)}</td>
                <td className="py-1 text-right">{point.earned > 0 ? formatPrice(point.earned) : "—"}</td>
                <td className="py-1 text-right">{point.expected > 0 ? formatPrice(point.expected) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Plus petite valeur « ronde » (1, 2, 2,5 ou 5 × 10ⁿ) au moins égale à `value`. */
function niceCeil(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= value) ?? 10;
  return step * magnitude;
}

const compactFormat = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function compact(value: number): string {
  return compactFormat.format(value);
}
