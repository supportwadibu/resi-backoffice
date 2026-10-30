import { HandCoins } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/badge";
import { ButtonLink } from "@/components/button";
import { FilterBar } from "@/components/filter-bar";
import { RowActions } from "@/components/icon-button";
import { DetailList, EmptyState, PageHeader, Section } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Select } from "@/components/select";
import { STATUS_TONES, SponsorshipStatusBadge } from "@/components/status-badges";
import { Cell, Row, RowLink, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type {
  Paginated,
  RewardRule,
  Sponsorship,
  SponsorshipRole,
  SponsorshipSettings,
  SponsorshipStatus,
} from "@/lib/api/types";
import { formatDate, formatPrice } from "@/lib/format";
import {
  REDEMPTION_TYPE_LABELS,
  SPONSORSHIP_ROLE_LABELS,
  SPONSORSHIP_STATUS_LABELS,
  SPONSORSHIP_TRIGGER_LABELS,
  toOptions,
} from "@/lib/labels";
import { enumParam, pageParam } from "@/lib/search-params";

import { CancelSponsorship } from "./sponsorship-actions";
import { SponsorshipSettingsButton } from "./sponsorship-settings";

export const metadata: Metadata = { title: "Parrainages" };

const STATUSES = Object.keys(SPONSORSHIP_STATUS_LABELS) as SponsorshipStatus[];

function describeReward(rule: RewardRule): string {
  if (rule.mode === "fixed") return `${formatPrice(rule.value)} par filleul`;
  const cap = rule.max_amount !== null ? `, plafonné à ${formatPrice(rule.max_amount)}` : "";
  return `${rule.value} % du montant payé${cap}`;
}

function describeHold(days: number): string {
  return days === 0 ? "disponible aussitôt" : `disponible après ${days} j`;
}

/** Fiche d'un parrain ou d'un filleul : un propriétaire a la sienne, un client non. */
function PersonLink({
  person,
  role,
}: {
  person: { id: string; full_name: string } | null;
  role: SponsorshipRole;
}) {
  if (!person) return <span className="text-muted">Compte supprimé</span>;
  return (
    <>
      {role === "proprio" ? (
        <RowLink href={`/proprietaires/${person.id}`}>{person.full_name}</RowLink>
      ) : (
        <span>{person.full_name}</span>
      )}
      <div className="text-xs text-muted">{SPONSORSHIP_ROLE_LABELS[role]}</div>
    </>
  );
}

export default async function ParrainagesPage({ searchParams }: PageProps<"/parrainages">) {
  const params = await searchParams;
  const filters = { status: enumParam(params, "status", STATUSES) };

  const [{ data: sponsorships, meta }, { data: settings }] = await Promise.all([
    apiFetch<Paginated<Sponsorship>>("/admin/sponsorships", {
      query: { ...filters, page: pageParam(params), per_page: 25 },
    }),
    apiFetch<{ data: SponsorshipSettings }>("/admin/settings/sponsorships"),
  ]);

  return (
    <div>
      <PageHeader
        title="Parrainages"
        description="Filleuls inscrits avec un code, et le gain que leur première action payée rapporte au parrain."
        actions={
          <>
            <ButtonLink href="/parrainages/retraits">
              <HandCoins aria-hidden className="size-4" />
              Retraits de gains
            </ButtonLink>
            <SponsorshipSettingsButton settings={settings} />
          </>
        }
      />

      <Section title="Programme" className="mb-6">
        <DetailList
          items={[
            [
              "Gains",
              settings.enabled ? (
                <Badge tone={STATUS_TONES.done}>Activés</Badge>
              ) : (
                <Badge tone={STATUS_TONES.idle}>Coupés</Badge>
              ),
            ],
            [
              "Filleul client",
              `${describeReward(settings.rewards.client)} — ${describeHold(settings.rewards.client.hold_days)}`,
            ],
            [
              "Filleul propriétaire",
              `${describeReward(settings.rewards.proprio)} — ${describeHold(settings.rewards.proprio.hold_days)}`,
            ],
            ...(["client", "proprio"] as const).map(
              (role): [string, string] => [
                `Usage, parrain ${SPONSORSHIP_ROLE_LABELS[role].toLowerCase()}`,
                settings.redemption[role].options.length === 0
                  ? "Aucun usage ouvert"
                  : `Dès ${formatPrice(settings.redemption[role].minimum_amount)} : ${settings.redemption[role].options
                      .map((option) => REDEMPTION_TYPE_LABELS[option].toLowerCase())
                      .join(", ")}`,
              ],
            ),
            ["Saisie d'un code", `Jusqu'à ${settings.attach_window_days} j après l'inscription`],
          ]}
        />
      </Section>

      <FilterBar key={JSON.stringify(filters)} path="/parrainages" active={filters.status !== undefined}>
        <Select
          label="Statut"
          name="status"
          defaultValue={filters.status ?? ""}
          placeholder="Tous"
          options={toOptions(SPONSORSHIP_STATUS_LABELS)}
        />
      </FilterBar>

      {sponsorships.length === 0 ? (
        <EmptyState>Aucun parrainage ne correspond à ces critères.</EmptyState>
      ) : (
        <Table head={["Parrain", "Filleul", "Code", "Gain", "Statut", "Inscrit le", ""]}>
          {sponsorships.map((sponsorship) => (
            <Row key={sponsorship.id}>
              <Cell>
                <PersonLink person={sponsorship.sponsor} role={sponsorship.sponsor_role} />
              </Cell>
              <Cell>
                <PersonLink person={sponsorship.sponsored} role={sponsorship.sponsored_role} />
              </Cell>
              <Cell className="font-mono">{sponsorship.code}</Cell>
              <Cell className="whitespace-nowrap tabular-nums">
                {sponsorship.trigger ? (
                  <>
                    <div>{formatPrice(sponsorship.reward_amount)}</div>
                    <div className="text-xs text-muted">
                      {SPONSORSHIP_TRIGGER_LABELS[sponsorship.trigger]}
                      {sponsorship.trigger_amount !== null &&
                        ` · ${formatPrice(sponsorship.trigger_amount)}`}
                    </div>
                  </>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Cell>
              <Cell>
                <SponsorshipStatusBadge status={sponsorship.status} />
                {sponsorship.status === "pending" && sponsorship.available_at && (
                  <div className="mt-1 text-xs text-muted">
                    Disponible le {formatDate(sponsorship.available_at)}
                  </div>
                )}
                {sponsorship.cancellation_reason && (
                  <div className="mt-1 max-w-56 text-xs text-muted">
                    {sponsorship.cancellation_reason}
                  </div>
                )}
              </Cell>
              <Cell className="whitespace-nowrap">{formatDate(sponsorship.created_at)}</Cell>
              <Cell className="text-right">
                {sponsorship.status !== "cancelled" && (
                  <RowActions>
                    <CancelSponsorship
                      id={sponsorship.id}
                      earned={sponsorship.status === "earned"}
                    />
                  </RowActions>
                )}
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination
        meta={meta}
        path="/parrainages"
        filters={filters}
        noun={["parrainage", "parrainages"]}
      />
    </div>
  );
}
