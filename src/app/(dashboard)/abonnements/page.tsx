import type { Metadata } from "next";

import { Badge } from "@/components/badge";
import { FilterBar } from "@/components/filter-bar";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ScopeHiddenInputs, ScopeNote } from "@/components/scope-note";
import { Select } from "@/components/select";
import { PlanTierBadge, STATUS_TONES, SubscriptionStatusBadge } from "@/components/status-badges";
import { RowActions } from "@/components/icon-button";
import { Cell, Row, RowLink, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { Paginated, Plan, Subscription, SubscriptionStatus } from "@/lib/api/types";
import { formatDate, formatPrice } from "@/lib/format";
import { SUBSCRIPTION_STATUS_LABELS, toOptions } from "@/lib/labels";
import { boolParam, enumParam, pageParam, param } from "@/lib/search-params";

import { CancelSubscription } from "./cancel-subscription";
import { ExtendSubscription } from "./extend-subscription";

export const metadata: Metadata = { title: "Abonnements" };

const STATUSES = Object.keys(SUBSCRIPTION_STATUS_LABELS) as SubscriptionStatus[];
/** Statuts que l'API accepte d'annuler. */
const CANCELLABLE: SubscriptionStatus[] = ["pending", "trial", "active"];
/** Statuts que l'API accepte de prolonger : un abonnement en cours. */
const EXTENDABLE: SubscriptionStatus[] = ["trial", "active"];

export default async function AbonnementsPage({ searchParams }: PageProps<"/abonnements">) {
  const params = await searchParams;
  const scope = { user_id: param(params, "user_id") };
  const filters = {
    ...scope,
    status: enumParam(params, "status", STATUSES),
    is_trial: boolParam(params, "is_trial"),
  };

  // Les plans servent à nommer chaque ligne : l'abonnement ne porte que l'identifiant.
  const [{ data: subscriptions, meta }, { data: plans }] = await Promise.all([
    apiFetch<Paginated<Subscription>>("/admin/subscriptions", {
      query: { ...filters, page: pageParam(params), per_page: 25 },
    }),
    apiFetch<Paginated<Plan>>("/admin/plans", { query: { per_page: 100 } }),
  ]);
  const planNames = new Map(plans.map((plan) => [plan.id, plan.name]));

  return (
    <div>
      <PageHeader title="Abonnements" description="Essais et abonnements payants des propriétaires." />

      <ScopeNote labels={scope.user_id ? ["un propriétaire"] : []} clearHref="/abonnements" />

      <FilterBar
        key={JSON.stringify(filters)}
        path="/abonnements"
        active={filters.status !== undefined || filters.is_trial !== undefined}
      >
        <ScopeHiddenInputs scope={scope} />
        <Select
          label="Statut"
          name="status"
          defaultValue={filters.status ?? ""}
          placeholder="Tous"
          options={toOptions(SUBSCRIPTION_STATUS_LABELS)}
        />
        <Select
          label="Nature"
          name="is_trial"
          defaultValue={filters.is_trial === undefined ? "" : String(filters.is_trial)}
          placeholder="Toutes"
          options={[
            { value: "true", label: "Essais" },
            { value: "false", label: "Payants" },
          ]}
        />
      </FilterBar>

      {subscriptions.length === 0 ? (
        <EmptyState>Aucun abonnement ne correspond à ces critères.</EmptyState>
      ) : (
        <Table head={["Propriétaire", "Formule", "Statut", "Période", "Montant", ""]}>
          {subscriptions.map((subscription) => (
            <Row key={subscription.id}>
              <Cell>
                <RowLink href={`/proprietaires/${subscription.user_id}`}>Voir le propriétaire</RowLink>
                {subscription.payment_reference && (
                  <div className="text-xs text-muted">Réf. {subscription.payment_reference}</div>
                )}
              </Cell>
              <Cell>
                {subscription.is_trial ? (
                  <Badge tone={STATUS_TONES.ongoing}>Essai gratuit</Badge>
                ) : subscription.plan_id ? (
                  <>
                    <div>
                      {planNames.get(subscription.plan_id) ?? <span className="text-muted">Plan supprimé</span>}
                    </div>
                    {/* Le palier figé à la souscription, et non celui du plan aujourd'hui. */}
                    <div className="mt-1">
                      <PlanTierBadge tier={subscription.plan_tier} />
                    </div>
                  </>
                ) : (
                  "—"
                )}
              </Cell>
              <Cell>
                <SubscriptionStatusBadge status={subscription.status} />
                {subscription.cancel_reason && (
                  <div className="mt-1 max-w-56 text-xs text-muted">{subscription.cancel_reason}</div>
                )}
              </Cell>
              <Cell className="whitespace-nowrap">
                {formatDate(subscription.start_date)} → {formatDate(subscription.end_date)}
              </Cell>
              <Cell className="whitespace-nowrap tabular-nums">{formatPrice(subscription.amount)}</Cell>
              <Cell className="text-right">
                <RowActions>
                  {EXTENDABLE.includes(subscription.status) && (
                    <ExtendSubscription id={subscription.id} endDate={subscription.end_date} />
                  )}
                  {CANCELLABLE.includes(subscription.status) && <CancelSubscription id={subscription.id} />}
                </RowActions>
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination meta={meta} path="/abonnements" filters={filters} noun={["abonnement", "abonnements"]} />
    </div>
  );
}
