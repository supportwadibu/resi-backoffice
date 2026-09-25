import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { formatNumber } from "@/lib/format";

import type { BadgeTone } from "./badge";

const BAR_TONES: Record<BadgeTone, string> = {
  neutral: "bg-muted",
  green: "bg-accent-green",
  amber: "bg-accent-amber",
  red: "bg-accent-red",
  blue: "bg-accent-blue",
  violet: "bg-accent-violet",
};

export interface BreakdownRow<K extends string> {
  key: K;
  label: string;
  count: number;
}

/** Lignes d'une répartition, dans l'ordre des libellés et non dans celui de l'API. */
export function breakdownRows<K extends string>(
  counts: Record<K, number>,
  labels: Record<K, string>,
): BreakdownRow<K>[] {
  return (Object.keys(labels) as K[]).map((key) => ({ key, label: labels[key], count: counts[key] ?? 0 }));
}

/**
 * Répartition d'un total par catégorie, chaque ligne menant à la liste filtrée.
 *
 * `tones` : pour une répartition par statut, chaque jauge prend la couleur de
 * son badge. Sans, les jauges restent en noir et blanc — une couleur d'accent
 * y serait lue comme un statut.
 */
export function Breakdown<K extends string>({
  title,
  icon: Icon,
  rows,
  href,
  tones,
}: {
  title: string;
  icon: LucideIcon;
  rows: BreakdownRow<K>[];
  href?: (key: K) => string;
  tones?: Record<K, BadgeTone>;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="border border-border bg-surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden className="size-4 shrink-0 text-muted" />
        {title}
      </h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="flex items-baseline justify-between gap-2">
              {href ? (
                <Link href={href(row.key)} className="hover:underline">
                  {row.label}
                </Link>
              ) : (
                <span>{row.label}</span>
              )}
              <span className="tabular-nums">{formatNumber(row.count)}</span>
            </div>
            {/* Part du total en jauge fine : la longueur porte l'information. */}
            <div aria-hidden className="mt-1 h-1 bg-background">
              <div
                className={`h-full ${tones ? BAR_TONES[tones[row.key]] : "bg-primary"}`}
                style={{ width: total > 0 ? `${(row.count / total) * 100}%` : 0 }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
