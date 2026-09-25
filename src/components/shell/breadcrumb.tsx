"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { findNavItem } from "./navigation";

/**
 * Section courante dans l'en-tête. Sur une fiche, la section devient un lien
 * vers sa liste : le titre de la fiche est déjà porté par la page.
 */
export function Breadcrumb() {
  const pathname = usePathname();
  const item = findNavItem(pathname);
  if (!item) return null;

  const onDetail = pathname !== item.href;
  const section = (
    <>
      <item.icon aria-hidden className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </>
  );

  return (
    <nav aria-label="Fil d'Ariane" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        <li className="min-w-0">
          {onDetail ? (
            <Link href={item.href} className="flex items-center gap-2 text-muted hover:text-foreground">
              {section}
            </Link>
          ) : (
            <span aria-current="page" className="flex items-center gap-2 font-medium">
              {section}
            </span>
          )}
        </li>
        {onDetail && (
          <>
            <li aria-hidden className="text-muted">
              <ChevronRight className="size-4" />
            </li>
            <li aria-current="page" className="font-medium">
              Fiche
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
