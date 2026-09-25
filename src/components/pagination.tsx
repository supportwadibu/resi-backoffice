import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { PaginationMeta } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";
import { toQueryString } from "@/lib/search-params";

interface PaginationProps {
  meta: PaginationMeta;
  /** Chemin de la liste. */
  path: string;
  /** Filtres en cours, reportés sur les liens de page. */
  filters?: Record<string, string | number | boolean | undefined>;
  /** Nom de l'élément compté, au singulier et au pluriel. */
  noun: [singular: string, plural: string];
}

export function Pagination({ meta, path, filters = {}, noun }: PaginationProps) {
  const { total, currentPage, lastPage } = meta;
  const href = (page: number) => path + toQueryString({ ...filters, page: page > 1 ? page : undefined });

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted"
    >
      <span>
        {formatNumber(total)} {total > 1 ? noun[1] : noun[0]}
        {lastPage > 1 && ` · page ${currentPage} sur ${lastPage}`}
      </span>
      {lastPage > 1 && (
        <div className="flex gap-1">
          <PageLink href={href(currentPage - 1)} disabled={currentPage <= 1} label="Page précédente">
            <ChevronLeft aria-hidden className="size-4" />
          </PageLink>
          <PageLink href={href(currentPage + 1)} disabled={currentPage >= lastPage} label="Page suivante">
            <ChevronRight aria-hidden className="size-4" />
          </PageLink>
        </div>
      )}
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className = "flex size-9 items-center justify-center border border-border bg-surface";
  if (disabled) {
    return (
      <span aria-disabled className={`${className} opacity-40`} title={label}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={`${className} text-foreground hover:bg-background`}>
      {children}
    </Link>
  );
}
