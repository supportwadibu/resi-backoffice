import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type StatAccent = "neutral" | "violet" | "green" | "red" | "blue" | "amber";

const ACCENTS: Record<StatAccent, string> = {
  neutral: "border border-border bg-background text-muted",
  violet: "bg-accent-violet-soft text-accent-violet",
  green: "bg-accent-green-soft text-accent-green",
  red: "bg-accent-red-soft text-accent-red",
  blue: "bg-accent-blue-soft text-accent-blue",
  amber: "bg-accent-amber-soft text-accent-amber",
};

/**
 * Fond de la tuile : les deux seuls accents de surface des applis (lavande,
 * sable) ou neutre. Distinct de `accent`, qui ne colore que la pastille.
 */
export type StatSurface = "neutral" | "lavender" | "sand";

const SURFACES: Record<StatSurface, string> = {
  neutral: "border border-border bg-surface",
  lavender: "border border-lavender bg-lavender text-on-lavender",
  sand: "border border-sand bg-sand text-on-sand",
};

const NOTE_TONES = {
  up: "text-accent-green",
  down: "text-accent-red",
  attention: "text-accent-amber",
} as const;

export interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Couleur de la pastille d'icône. */
  accent?: StatAccent;
  /** Fond de la tuile. */
  surface?: StatSurface;
  note?: ReactNode;
  /** Couleur de la note : évolution ou point d'attention. */
  tone?: keyof typeof NOTE_TONES;
  /** Rend la tuile cliquable, vers la liste détaillée. */
  href?: string;
  className?: string;
}

/** Chiffre clé, avec son icône et une note de contexte. */
export function StatTile({
  label,
  value,
  icon: Icon,
  accent = "neutral",
  surface = "neutral",
  note,
  tone,
  href,
  className = "",
}: StatTileProps) {
  const tinted = surface !== "neutral";
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className={`text-sm ${tinted ? "opacity-75" : "text-muted"}`}>{label}</div>
        {/* Sur lavande ou sable (clairs dans les deux modes), la note garde la
            teinte du texte : un vert ou un rouge de statut s’y lirait mal.
            La pastille passe en disque de surface. */}
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            tinted ? "bg-surface text-foreground" : ACCENTS[accent]
          }`}
        >
          <Icon aria-hidden className="size-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {note && (
        <div className={`mt-1 flex items-center gap-1 text-xs ${tinted ? "opacity-75" : tone ? NOTE_TONES[tone] : "text-muted"}`}>
          {note}
        </div>
      )}
    </>
  );

  const base = `block rounded-md p-4 transition-colors ${SURFACES[surface]} ${className}`;
  return href ? (
    <Link href={href} className={`${base} hover:border-primary`}>
      {content}
    </Link>
  ) : (
    <div className={base}>{content}</div>
  );
}
