"use client";

import { useState } from "react";

import type { RevenuePoint } from "@/lib/api/types";
import { formatMonth, formatNumber, formatPrice } from "@/lib/format";

const HEIGHT = 200;

/**
 * Revenu mensuel en colonnes : une seule série, donc ni légende ni seconde
 * couleur — le titre de la section la nomme.
 *
 * Chaque colonne est focalisable et porte la valeur dans son libellé
 * accessible ; l'infobulle suit le survol comme le clavier. Le tableau
 * repliable sous le graphique rend toutes les valeurs lisibles sans survol.
 */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((point) => point.revenue), 0);
  // Échelle arrondie au-dessus du maximum : un axe à « 1 237 500 » se lit mal.
  const top = niceCeil(max);
  const last = data.length - 1;

  return (
    <div>
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
          {/* Quadrillage en retrait : trois repères suffisent à estimer. */}
          <div aria-hidden className="absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: HEIGHT }}>
            <div className="border-t border-dashed border-border" />
            <div className="border-t border-dashed border-border" />
            <div className="border-t border-border" />
          </div>

          <ol className="relative flex items-end" style={{ height: HEIGHT }}>
            {data.map((point, index) => {
              const ratio = top > 0 ? point.revenue / top : 0;
              const label = `${formatMonth(point.month)} : ${formatPrice(point.revenue)}, ${formatNumber(point.bookings_started)} séjour${point.bookings_started > 1 ? "s" : ""} commencé${point.bookings_started > 1 ? "s" : ""}`;
              return (
                <li key={point.month} className="relative flex h-full flex-1 justify-center">
                  <button
                    type="button"
                    aria-label={label}
                    onPointerEnter={() => setActive(index)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    // Zone de survol sur toute la hauteur et toute la largeur
                    // du créneau : viser une colonne basse de 2 px serait vain.
                    className="flex h-full w-full items-end justify-center outline-none focus-visible:bg-background"
                  >
                    <span
                      className={`block w-full max-w-6 bg-accent-violet transition-opacity ${
                        active !== null && active !== index ? "opacity-50" : ""
                      }`}
                      style={{ height: `${ratio * 100}%`, minHeight: point.revenue > 0 ? 2 : 0 }}
                    />
                  </button>

                  {index === last && active === null && point.revenue > 0 && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute text-xs font-medium whitespace-nowrap tabular-nums"
                      style={{ bottom: `calc(${ratio * 100}% + 4px)` }}
                    >
                      {compact(point.revenue)}
                    </span>
                  )}

                  {active === index && (
                    <div
                      role="presentation"
                      className={`pointer-events-none absolute z-10 border border-border bg-surface px-3 py-2 text-xs shadow-lg ${
                        index > data.length / 2 ? "right-0" : "left-0"
                      }`}
                      style={{ bottom: `calc(${Math.min(ratio, 0.85) * 100}% + 8px)` }}
                    >
                      <div className="text-sm font-semibold whitespace-nowrap tabular-nums">
                        {formatPrice(point.revenue)}
                      </div>
                      <div className="whitespace-nowrap text-muted">
                        {formatMonth(point.month)} · {formatNumber(point.bookings_started)} séjour
                        {point.bookings_started > 1 ? "s" : ""}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <ol aria-hidden className="mt-2 flex text-xs text-muted">
            {data.map((point, index) => (
              <li key={point.month} className="flex-1 text-center">
                {/* Un mois sur deux sur les petits écrans, pour ne pas chevaucher. */}
                <span className={index % 2 === last % 2 ? "" : "max-sm:invisible"}>
                  {formatMonth(point.month)}
                </span>
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
              <th scope="col" className="py-1 text-right font-medium">Revenu</th>
              <th scope="col" className="py-1 text-right font-medium">Séjours commencés</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((point) => (
              <tr key={point.month} className="border-t border-border">
                <td className="py-1">{formatMonth(point.month)}</td>
                <td className="py-1 text-right">{formatPrice(point.revenue)}</td>
                <td className="py-1 text-right">{formatNumber(point.bookings_started)}</td>
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
