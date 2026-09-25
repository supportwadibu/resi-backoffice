import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const TONES = {
  default: "text-muted hover:bg-background hover:text-foreground",
  // Gris au repos, rouge au survol : sur une liste, une colonne d'icônes
  // rouges crierait sur chaque ligne. La confirmation reste dans le dialogue.
  danger: "text-muted hover:bg-danger-surface hover:text-danger",
} as const;

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label" | "title"> {
  icon: LucideIcon;
  /** Nom de l'action : infobulle au survol, libellé pour les lecteurs d'écran. */
  label: string;
  tone?: keyof typeof TONES;
}

/** Action d'une ligne de tableau, en icône seule pour garder la colonne étroite. */
export function IconButton({
  icon: Icon,
  label,
  tone = "default",
  type = "button",
  className = "",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-8 shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-60 ${TONES[tone]} ${className}`}
      {...rest}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}

/** Actions d'une ligne, alignées à droite de leur cellule. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-1">{children}</div>;
}
