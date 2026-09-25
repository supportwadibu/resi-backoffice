import type { Metadata } from "next";

import { FilterBar } from "@/components/filter-bar";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ScopeHiddenInputs, ScopeNote } from "@/components/scope-note";
import { Select } from "@/components/select";
import { BookingStatusBadge } from "@/components/status-badges";
import { Cell, PersonCell, Row, RowLink, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { BookingStatus, Paginated, PlatformBooking } from "@/lib/api/types";
import { formatDate, formatPrice } from "@/lib/format";
import { BOOKING_SOURCE_LABELS, BOOKING_STATUS_LABELS, toOptions } from "@/lib/labels";
import { enumParam, pageParam, param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Réservations" };

const STATUSES = Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[];

export default async function ReservationsPage({ searchParams }: PageProps<"/reservations">) {
  const params = await searchParams;
  const scope = {
    owner_id: param(params, "owner_id"),
    property_id: param(params, "property_id"),
    client_id: param(params, "client_id"),
  };
  const filters = { ...scope, status: enumParam(params, "status", STATUSES) };

  const { data: bookings, meta } = await apiFetch<Paginated<PlatformBooking>>("/admin/bookings", {
    query: { ...filters, page: pageParam(params), per_page: 25 },
  });

  const scopeLabels = [
    scope.owner_id && "un propriétaire",
    scope.property_id && "un logement",
    scope.client_id && "un client",
  ].filter((label): label is string => Boolean(label));

  return (
    <div>
      <PageHeader title="Réservations" description="Réservations en ligne et au comptoir, toute la plateforme." />

      <ScopeNote labels={scopeLabels} clearHref="/reservations" />

      <FilterBar key={JSON.stringify(filters)} path="/reservations" active={filters.status !== undefined}>
        <ScopeHiddenInputs scope={scope} />
        <Select
          label="Statut"
          name="status"
          defaultValue={filters.status ?? ""}
          placeholder="Tous"
          options={toOptions(BOOKING_STATUS_LABELS)}
        />
      </FilterBar>

      {bookings.length === 0 ? (
        <EmptyState>Aucune réservation ne correspond à ces critères.</EmptyState>
      ) : (
        <Table head={["Séjour", "Logement", "Client", "Propriétaire", "Statut", "Montant"]}>
          {bookings.map((booking) => (
            <Row key={booking.id}>
              <Cell className="whitespace-nowrap">
                <RowLink href={`/reservations/${booking.id}`}>
                  {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                </RowLink>
                <div className="text-xs text-muted">
                  {booking.days_count} jour{booking.days_count > 1 ? "s" : ""} ·{" "}
                  {BOOKING_SOURCE_LABELS[booking.source ?? "online"]}
                </div>
              </Cell>
              <Cell>
                {booking.property ? (
                  <RowLink href={`/logements/${booking.property.id}`}>
                    {booking.property.unit_label ?? booking.property.title}
                  </RowLink>
                ) : (
                  <span className="text-muted">Supprimé</span>
                )}
                {booking.residence && <div className="text-xs text-muted">{booking.residence.name}</div>}
              </Cell>
              <Cell>
                {booking.client ? (
                  <PersonCell
                    name={booking.client.full_name}
                    contact={booking.client.phone}
                    href={booking.client.kind === "account" ? `/comptes/${booking.client.id}` : undefined}
                  />
                ) : (
                  <span className="text-muted">Inconnu</span>
                )}
              </Cell>
              <Cell>
                {booking.owner ? (
                  <PersonCell name={booking.owner.full_name} href={`/proprietaires/${booking.owner.id}`} />
                ) : (
                  <span className="text-muted">Introuvable</span>
                )}
              </Cell>
              <Cell>
                <BookingStatusBadge status={booking.status} />
              </Cell>
              <Cell className="whitespace-nowrap tabular-nums">{formatPrice(booking.total_amount)}</Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination meta={meta} path="/reservations" filters={filters} noun={["réservation", "réservations"]} />
    </div>
  );
}
