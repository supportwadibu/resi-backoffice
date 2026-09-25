import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Tableau de liste. Les en-têtes sont passés à part pour que chaque page n'ait
 * qu'à écrire ses lignes ; le défilement horizontal évite qu'un tableau large
 * fasse déborder la page sur mobile.
 */
export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted">
          <tr>
            {head.map((cell, index) => (
              <th key={index} scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <tr className="border-b border-border last:border-0 hover:bg-background">{children}</tr>;
}

export function Cell({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

/** Lien principal d'une ligne, vers la fiche de l'élément. */
export function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

/** Nom et coordonnées d'une personne, sur deux lignes. */
export function PersonCell({
  name,
  contact,
  href,
}: {
  name: string | null;
  contact?: string | null;
  href?: string;
}) {
  const label = name ?? "Sans nom";
  return (
    <div className="min-w-0">
      {href ? <RowLink href={href}>{label}</RowLink> : <span className="font-medium">{label}</span>}
      {contact && <div className="text-xs text-muted">{contact}</div>}
    </div>
  );
}
