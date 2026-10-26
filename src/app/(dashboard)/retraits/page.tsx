import type { Metadata } from "next";

import { FilterBar } from "@/components/filter-bar";
import { RowActions } from "@/components/icon-button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Select } from "@/components/select";
import { WithdrawalStatusBadge } from "@/components/status-badges";
import { Cell, Row, RowLink, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { Paginated, Withdrawal, WithdrawalSettings, WithdrawalStatus } from "@/lib/api/types";
import { formatDate, formatPrice } from "@/lib/format";
import { WITHDRAWAL_STATUS_LABELS, toOptions } from "@/lib/labels";
import { enumParam, pageParam } from "@/lib/search-params";

import { MarkWithdrawalPaid, RejectWithdrawal } from "./withdrawal-actions";
import { WithdrawalSettingsButton } from "./withdrawal-settings";

export const metadata: Metadata = { title: "Retraits" };

const STATUSES = Object.keys(WITHDRAWAL_STATUS_LABELS) as WithdrawalStatus[];

export default async function RetraitsPage({ searchParams }: PageProps<"/retraits">) {
  const params = await searchParams;
  const filters = { status: enumParam(params, "status", STATUSES) };

  const [{ data: withdrawals, meta }, { data: settings }] = await Promise.all([
    apiFetch<Paginated<Withdrawal>>("/admin/withdrawals", {
      query: { ...filters, page: pageParam(params), per_page: 25 },
    }),
    apiFetch<{ data: WithdrawalSettings }>("/admin/settings/withdrawals"),
  ]);

  return (
    <div>
      <PageHeader
        title="Retraits"
        description="Demandes de retrait des portefeuilles : à verser par Wave, net des frais de 1 %."
        actions={<WithdrawalSettingsButton minimumAmount={settings.minimum_amount} />}
      />

      <FilterBar key={JSON.stringify(filters)} path="/retraits" active={filters.status !== undefined}>
        <Select
          label="Statut"
          name="status"
          defaultValue={filters.status ?? ""}
          placeholder="Tous"
          options={toOptions(WITHDRAWAL_STATUS_LABELS)}
        />
      </FilterBar>

      {withdrawals.length === 0 ? (
        <EmptyState>Aucune demande de retrait ne correspond à ces critères.</EmptyState>
      ) : (
        <Table head={["Propriétaire", "Portefeuille", "À verser", "Wave", "Statut", "Demandé le", ""]}>
          {withdrawals.map((withdrawal) => (
            <Row key={withdrawal.id}>
              <Cell>
                {withdrawal.owner ? (
                  <RowLink href={`/proprietaires/${withdrawal.owner.id}`}>{withdrawal.owner.full_name}</RowLink>
                ) : (
                  <span className="text-muted">Compte supprimé</span>
                )}
              </Cell>
              <Cell>{withdrawal.residence_name ?? <span className="text-muted">Biens hors résidence</span>}</Cell>
              <Cell className="whitespace-nowrap tabular-nums">
                <div>{formatPrice(withdrawal.net_amount)}</div>
                <div className="text-xs text-muted">
                  {formatPrice(withdrawal.amount)} − {formatPrice(withdrawal.fee)} de frais
                </div>
              </Cell>
              <Cell className="whitespace-nowrap">
                <div className="tabular-nums">{withdrawal.payout_phone}</div>
                {withdrawal.payout_name && <div className="text-xs text-muted">{withdrawal.payout_name}</div>}
                {withdrawal.payout_slot != null && (
                  <div className="text-xs text-muted">Numéro {withdrawal.payout_slot} du propriétaire</div>
                )}
              </Cell>
              <Cell>
                <WithdrawalStatusBadge status={withdrawal.status} />
                {withdrawal.payout_reference && (
                  <div className="mt-1 text-xs text-muted">Réf. {withdrawal.payout_reference}</div>
                )}
                {withdrawal.rejection_reason && (
                  <div className="mt-1 max-w-56 text-xs text-muted">{withdrawal.rejection_reason}</div>
                )}
              </Cell>
              <Cell className="whitespace-nowrap">{formatDate(withdrawal.created_at)}</Cell>
              <Cell className="text-right">
                {withdrawal.status === "pending" && (
                  <RowActions>
                    <MarkWithdrawalPaid
                      id={withdrawal.id}
                      netAmount={withdrawal.net_amount}
                      payoutPhone={withdrawal.payout_phone}
                    />
                    <RejectWithdrawal id={withdrawal.id} />
                  </RowActions>
                )}
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination meta={meta} path="/retraits" filters={filters} noun={["retrait", "retraits"]} />
    </div>
  );
}
