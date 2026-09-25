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
  note,
  tone,
  href,
  className = "",
}: StatTileProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-muted">{label}</div>
        <span className={`flex size-9 shrink-0 items-center justify-center ${ACCENTS[accent]}`}>
          <Icon aria-hidden className="size-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {note && (
        <div className={`mt-1 flex items-center gap-1 text-xs ${tone ? NOTE_TONES[tone] : "text-muted"}`}>
          {note}
        </div>
      )}
    </>
  );

  const base = `block border border-border bg-surface p-4 ${className}`;
  return href ? (
    <Link href={href} className={`${base} hover:border-primary`}>
      {content}
    </Link>
  ) : (
    <div className={base}>{content}</div>
  );
}
