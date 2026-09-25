import type { Metadata } from "next";

import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ScopeNote } from "@/components/scope-note";
import { Cell, PersonCell, Row, RowLink, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { Paginated, PlatformResidence } from "@/lib/api/types";
import { formatDate, formatNumber } from "@/lib/format";
import { pageParam, param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Résidences" };

export default async function ResidencesPage({ searchParams }: PageProps<"/residences">) {
  const params = await searchParams;
  const filters = { owner_id: param(params, "owner_id") };

  const { data: residences, meta } = await apiFetch<Paginated<PlatformResidence>>("/admin/residences", {
    query: { ...filters, page: pageParam(params), per_page: 25 },
  });

  return (
    <div>
      <PageHeader
        title="Résidences"
        description="Regroupements de logements. Une résidence ne se loue pas : ses unités, si."
      />

      <ScopeNote labels={filters.owner_id ? ["un propriétaire"] : []} clearHref="/residences" />

      {residences.length === 0 ? (
        <EmptyState>Aucune résidence.</EmptyState>
      ) : (
        <Table head={["Résidence", "Propriétaire", "Unités", "Création"]}>
          {residences.map((residence) => (
            <Row key={residence.id}>
              <Cell>
                <RowLink href={`/residences/${residence.id}`}>{residence.name}</RowLink>
                <div className="text-xs text-muted">{residence.address.city}</div>
              </Cell>
              <Cell>
                {residence.owner ? (
                  <PersonCell
                    name={residence.owner.full_name}
                    contact={residence.owner.phone}
                    href={`/proprietaires/${residence.owner.id}`}
                  />
                ) : (
                  <span className="text-muted">Introuvable</span>
                )}
              </Cell>
              <Cell className="tabular-nums">{formatNumber(residence.units_count)}</Cell>
              <Cell className="whitespace-nowrap">{formatDate(residence.created_at)}</Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination meta={meta} path="/residences" filters={filters} noun={["résidence", "résidences"]} />
    </div>
  );
}
