import type { Metadata } from "next";

import { FilterBar } from "@/components/filter-bar";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ScopeHiddenInputs, ScopeNote } from "@/components/scope-note";
import { Select } from "@/components/select";
import { PropertyStatusBadge } from "@/components/status-badges";
import { Cell, PersonCell, Row, RowLink, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { Paginated, PlatformProperty, PropertyStatus, PropertyType } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS, toOptions } from "@/lib/labels";
import { enumParam, pageParam, param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Logements" };

const STATUSES = Object.keys(PROPERTY_STATUS_LABELS) as PropertyStatus[];
const TYPES = Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[];

export default async function LogementsPage({ searchParams }: PageProps<"/logements">) {
  const params = await searchParams;
  const scope = { owner_id: param(params, "owner_id"), residence_id: param(params, "residence_id") };
  const filters = {
    ...scope,
    status: enumParam(params, "status", STATUSES),
    property_type: enumParam(params, "property_type", TYPES),
  };

  const { data: properties, meta } = await apiFetch<Paginated<PlatformProperty>>("/admin/properties", {
    query: { ...filters, page: pageParam(params), per_page: 25 },
  });

  const scopeLabels = [
    scope.owner_id && "un propriétaire",
    scope.residence_id && "une résidence",
  ].filter((label): label is string => Boolean(label));

  return (
    <div>
      <PageHeader
        title="Logements"
        description="Unités louables de tous les propriétaires, en résidence ou autonomes."
      />

      <ScopeNote labels={scopeLabels} clearHref="/logements" />

      <FilterBar
        key={JSON.stringify(filters)}
        path="/logements"
        active={filters.status !== undefined || filters.property_type !== undefined}
      >
        <ScopeHiddenInputs scope={scope} />
        <Select
          label="Statut"
          name="status"
          defaultValue={filters.status ?? ""}
          placeholder="Tous"
          options={toOptions(PROPERTY_STATUS_LABELS)}
        />
        <Select
          label="Type"
          name="property_type"
          defaultValue={filters.property_type ?? ""}
          placeholder="Tous"
          options={toOptions(PROPERTY_TYPE_LABELS)}
        />
      </FilterBar>

      {properties.length === 0 ? (
        <EmptyState>Aucun logement ne correspond à ces critères.</EmptyState>
      ) : (
        <Table head={["Logement", "Résidence", "Propriétaire", "Statut", "Prix / jour"]}>
          {properties.map((property) => (
            <Row key={property.id}>
              <Cell>
                <RowLink href={`/logements/${property.id}`}>{property.title}</RowLink>
                <div className="text-xs text-muted">
                  {[property.unit_label, PROPERTY_TYPE_LABELS[property.property_type], property.address.city]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </Cell>
              <Cell>
                <ResidenceCell property={property} />
              </Cell>
              <Cell>
                {property.owner ? (
                  <PersonCell
                    name={property.owner.full_name}
                    contact={property.owner.phone}
                    href={`/proprietaires/${property.owner.id}`}
                  />
                ) : (
                  <span className="text-muted">Introuvable</span>
                )}
              </Cell>
              <Cell>
                <PropertyStatusBadge status={property.status} />
              </Cell>
              <Cell className="whitespace-nowrap tabular-nums">{formatPrice(property.pricing.daily_price)}</Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination meta={meta} path="/logements" filters={filters} noun={["logement", "logements"]} />
    </div>
  );
}

function ResidenceCell({ property }: { property: PlatformProperty }) {
  if (property.residence) {
    return <RowLink href={`/residences/${property.residence.id}`}>{property.residence.name}</RowLink>;
  }
  // Un `residence_id` sans résidence : celle-ci a été supprimée depuis.
  if (property.residence_id) return <span className="text-accent-amber">Résidence supprimée</span>;
  return <span className="text-muted">Autonome</span>;
}
