import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

/** Fiche introuvable (404 de l'API) ou adresse inconnue : la navigation reste affichée. */
export default function DashboardNotFound() {
  return (
    <div className="flex gap-4 border border-border bg-surface p-6">
      <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-background text-muted">
        <SearchX aria-hidden className="size-5" />
      </span>
      <div>
        <h1 className="font-semibold">Introuvable</h1>
        <p className="mt-1 text-sm text-muted">
          Cet élément n&apos;existe pas ou a été supprimé.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
