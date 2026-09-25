import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue" | "violet";

const TONES: Record<BadgeTone, string> = {
  neutral: "border border-border text-muted",
  green: "bg-accent-green-soft text-accent-green",
  amber: "bg-accent-amber-soft text-accent-amber",
  red: "bg-accent-red-soft text-accent-red",
  blue: "bg-accent-blue-soft text-accent-blue",
  violet: "bg-accent-violet-soft text-accent-violet",
};

/** Pastille de statut. Le libellé porte le sens : la couleur ne fait que le souligner. */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}
