import Link from "next/link";

/**
 * Filtres par identifiant, posés par un lien depuis une fiche (« Réservations
 * de ce propriétaire ») et non par la barre de filtres.
 *
 * Rendus en champs cachés dans la barre pour survivre à un changement des
 * autres filtres, et signalés ici pour qu'on ne prenne pas une liste réduite
 * pour la liste complète.
 */
export function ScopeHiddenInputs({ scope }: { scope: Record<string, string | undefined> }) {
  return (
    <>
      {Object.entries(scope).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
    </>
  );
}

export function ScopeNote({ labels, clearHref }: { labels: string[]; clearHref: string }) {
  if (labels.length === 0) return null;
  return (
    <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
      Liste restreinte : {labels.join(", ")}.
      <Link href={clearHref} className="text-foreground underline-offset-4 hover:underline">
        Tout afficher
      </Link>
    </p>
  );
}
