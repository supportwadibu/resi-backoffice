import type { Metadata } from "next";

import { FilterBar } from "@/components/filter-bar";
import { RowActions } from "@/components/icon-button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Select } from "@/components/select";
import { RedemptionStatusBadge } from "@/components/status-badges";
import { Cell, Row, RowLink, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type {
  Paginated,
  RedemptionStatus,
  RedemptionType,
  SponsorshipRedemption,
} from "@/lib/api/types";
import { formatDate, formatPrice } from "@/lib/format";
import {
  REDEMPTION_STATUS_LABELS,
  REDEMPTION_TYPE_LABELS,
  SPONSORSHIP_ROLE_LABELS,
  toOptions,
} from "@/lib/labels";
import { enumParam, pageParam } from "@/lib/search-params";

import { MarkRedemptionPaid, RejectRedemption } from "../sponsorship-actions";

export const metadata: Metadata = { title: "Retraits de gains" };

const STATUSES = Object.keys(REDEMPTION_STATUS_LABELS) as RedemptionStatus[];
const TYPES = Object.keys(REDEMPTION_TYPE_LABELS) as RedemptionType[];

export default async function RetraitsDeGainsPage({
  searchParams,
}: PageProps<"/parrainages/retraits">) {
  const params = await searchParams;
  const filters = {
    status: enumParam(params, "status", STATUSES),
    type: enumParam(params, "type", TYPES),
  };

  const { data: redemptions, meta } = await apiFetch<Paginated<SponsorshipRedemption>>(
    "/admin/sponsorship-redemptions",
    { query: { ...filters, page: pageParam(params), per_page: 25 } },
  );

  return (
    <div>
      <PageHeader
        title="Retraits de gains"
        back={{ href: "/parrainages", label: "Parrainages" }}
        description="Gains de parrainage retirés sur Wave, à verser en entier — sans frais —, et conversions en crédit."
      />

      <FilterBar
        key={JSON.stringify(filters)}
        path="/parrainages/retraits"
        active={filters.status !== undefined || filters.type !== undefined}
      >
        <Select
          label="Usage"
          name="type"
          defaultValue={filters.type ?? ""}
          placeholder="Tous"
          options={toOptions(REDEMPTION_TYPE_LABELS)}
        />
        <Select
          label="Statut"
          name="status"
          defaultValue={filters.status ?? ""}
          placeholder="Tous"
          options={toOptions(REDEMPTION_STATUS_LABELS)}
        />
      </FilterBar>

      {redemptions.length === 0 ? (
        <EmptyState>Aucune demande ne correspond à ces critères.</EmptyState>
      ) : (
        <Table head={["Parrain", "Usage", "Montant", "Wave", "Statut", "Demandé le", ""]}>
          {redemptions.map((redemption) => (
            <Row key={redemption.id}>
              <Cell>
                {redemption.user ? (
                  redemption.user_role === "proprio" ? (
                    <RowLink href={`/proprietaires/${redemption.user.id}`}>
                      {redemption.user.full_name}
                    </RowLink>
                  ) : (
                    <span>{redemption.user.full_name}</span>
                  )
                ) : (
                  <span className="text-muted">Compte supprimé</span>
                )}
                <div className="text-xs text-muted">
                  {SPONSORSHIP_ROLE_LABELS[redemption.user_role]}
                </div>
              </Cell>
              <Cell>{REDEMPTION_TYPE_LABELS[redemption.type]}</Cell>
              <Cell className="whitespace-nowrap tabular-nums">{formatPrice(redemption.amount)}</Cell>
              <Cell className="whitespace-nowrap">
                {redemption.payout_phone ? (
                  <>
                    <div className="tabular-nums">{redemption.payout_phone}</div>
                    {redemption.payout_name && (
                      <div className="text-xs text-muted">{redemption.payout_name}</div>
                    )}
                  </>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Cell>
              <Cell>
                <RedemptionStatusBadge status={redemption.status} />
                {redemption.payout_reference && (
                  <div className="mt-1 text-xs text-muted">Réf. {redemption.payout_reference}</div>
                )}
                {redemption.rejection_reason && (
                  <div className="mt-1 max-w-56 text-xs text-muted">{redemption.rejection_reason}</div>
                )}
              </Cell>
              <Cell className="whitespace-nowrap">{formatDate(redemption.created_at)}</Cell>
              <Cell className="text-right">
                {redemption.status === "pending" && redemption.payout_phone && (
                  <RowActions>
                    <MarkRedemptionPaid
                      id={redemption.id}
                      amount={redemption.amount}
                      payoutPhone={redemption.payout_phone}
                    />
                    <RejectRedemption id={redemption.id} />
                  </RowActions>
                )}
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination
        meta={meta}
        path="/parrainages/retraits"
        filters={filters}
        noun={["demande", "demandes"]}
      />
    </div>
  );
}
