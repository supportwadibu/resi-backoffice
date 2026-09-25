import { ListFilter, X } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "./button";

interface FilterBarProps {
  /** Chemin de la liste filtrée. */
  path: string;
  /** Au moins un filtre posé : affiche le lien de réinitialisation. */
  active: boolean;
  children: ReactNode;
}

/**
 * Filtres d'une liste, portés par l'URL : une vue filtrée se partage et survit
 * au rechargement. `next/form` soumet en GET avec une navigation client.
 *
 * Le numéro de page n'est pas repris : un nouveau filtre repart de la page 1.
 * Les champs sont non contrôlés (`defaultValue`) ; la page parente passe une
 * `key` tirée des filtres pour que « Réinitialiser » les vide réellement.
 */
export function FilterBar({ path, active, children }: FilterBarProps) {
  return (
    <Form
      action={path}
      className="mb-4 flex flex-wrap items-end gap-3 border border-border bg-surface p-3 *:min-w-40 *:flex-1 sm:*:flex-none"
    >
      {children}
      <div className="flex gap-2">
        <Button type="submit">
          <ListFilter aria-hidden className="size-4" />
          Filtrer
        </Button>
        {active && (
          <Link
            href={path}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-muted hover:bg-background hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
            Réinitialiser
          </Link>
        )}
      </div>
    </Form>
  );
}
