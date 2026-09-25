import type { Metadata } from "next";

import { FilterBar } from "@/components/filter-bar";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Select } from "@/components/select";
import { OwnerStatusBadge } from "@/components/status-badges";
import { Cell, PersonCell, Row, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { Owner, OwnerStatus, Paginated } from "@/lib/api/types";
import { formatDate, formatOptionalDate } from "@/lib/format";
import { OWNER_STATUS_LABELS, toOptions } from "@/lib/labels";
import { enumParam, pageParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Propriétaires" };

const STATUSES = Object.keys(OWNER_STATUS_LABELS) as OwnerStatus[];

export default async function ProprietairesPage({ searchParams }: PageProps<"/proprietaires">) {
  const params = await searchParams;
  const filters = { status: enumParam(params, "status", STATUSES) };

  const { data: owners, meta } = await apiFetch<Paginated<Owner>>("/admin/owners", {
    query: { ...filters, page: pageParam(params), per_page: 25 },
  });

  return (
    <div>
      <PageHeader
        title="Propriétaires"
        description="Validation des dossiers et suivi des comptes propriétaires."
      />

      <FilterBar key={JSON.stringify(filters)} path="/proprietaires" active={filters.status !== undefined}>
        <Select
          label="Statut"
          name="status"
          defaultValue={filters.status ?? ""}
          placeholder="Tous"
          options={toOptions(OWNER_STATUS_LABELS)}
        />
      </FilterBar>

      {owners.length === 0 ? (
        <EmptyState>Aucun propriétaire ne correspond à ces critères.</EmptyState>
      ) : (
        <Table head={["Nom", "Statut", "Dossier", "Validé le", "Inscription"]}>
          {owners.map((owner) => (
            <Row key={owner.id}>
              <Cell>
                <PersonCell
                  name={owner.full_name}
                  contact={owner.phone ?? owner.email}
                  href={`/proprietaires/${owner.id}`}
                />
              </Cell>
              <Cell>
                <OwnerStatusBadge status={owner.owner_status} />
              </Cell>
              <Cell>
                {owner.profile_submitted ? "Déposé" : <span className="text-muted">Non déposé</span>}
              </Cell>
              <Cell className="whitespace-nowrap">{formatOptionalDate(owner.validated_at)}</Cell>
              <Cell className="whitespace-nowrap">{formatDate(owner.created_at)}</Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination
        meta={meta}
        path="/proprietaires"
        filters={filters}
        noun={["propriétaire", "propriétaires"]}
      />
    </div>
  );
}
