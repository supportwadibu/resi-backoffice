import { ArrowDownUp, Coins, Percent, Receipt, Wallet } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/badge";
import { FilterBar } from "@/components/filter-bar";
import { DetailList, EmptyState, PageHeader, Section } from "@/components/page-header";
import { Select } from "@/components/select";
import { SECTION_ICONS } from "@/components/shell/navigation";
import { StatTile } from "@/components/stat-tile";
import { STATUS_TONES } from "@/components/status-badges";
import { Cell, Row, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type {
  CommissionSettings,
  DepositSettings,
  PlatformRevenue,
  RevenueGranularity,
} from "@/lib/api/types";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { COMMISSION_MODE_LABELS } from "@/lib/labels";
import { enumParam, param } from "@/lib/search-params";

import { CommissionSettingsButton } from "./commission-settings";
import { DepositSettingsButton } from "./deposit-settings";
import { REVENUE_PERIODS, revenueWindow, type RevenuePeriod } from "./period";

export const metadata: Metadata = { title: "Revenus RESI" };

const PERIODS = Object.keys(REVENUE_PERIODS) as RevenuePeriod[];
/** Années proposées : depuis le lancement de la plateforme. */
const FIRST_YEAR = 2025;

const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

function periodLabel(period: string, granularity: RevenueGranularity): string {
  if (granularity === "month") return MONTH.format(new Date(`${period}T00:00:00Z`));
  if (granularity === "week") return `Semaine du ${formatDate(period)}`;
  return formatDate(period);
}

function describeCommission(settings: CommissionSettings): string {
  const value = settings.mode === "percent" ? `${settings.value} %` : formatPrice(settings.value);
  return `${value} — ${COMMISSION_MODE_LABELS[settings.mode].toLowerCase()}`;
}

function describeDeposit(settings: DepositSettings): string {
  const value =
    settings.type === "percent" ? `${settings.value} % du séjour` : formatPrice(settings.value);
  return settings.owner_can_set ? `${value}, par défaut` : value;
}

/** Montant signé : ce qui sort des caisses de RESI s'affiche en rouge. */
function Amount({ value }: { value: number }) {
  return <span className={value < 0 ? "text-danger" : ""}>{formatPrice(value)}</span>;
}

export default async function RevenusPage({ searchParams }: PageProps<"/revenus">) {
  const params = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const period = enumParam(params, "periode", PERIODS) ?? "annee";
  const requestedYear = Number(param(params, "annee"));
  const year =
    Number.isInteger(requestedYear) && requestedYear >= FIRST_YEAR && requestedYear <= currentYear
      ? requestedYear
      : currentYear;
  const window = revenueWindow(period, year);

  const [{ data: revenue }, { data: settings }, { data: deposit }] = await Promise.all([
    apiFetch<{ data: PlatformRevenue }>("/admin/stats/platform-revenue", { query: { ...window } }),
    apiFetch<{ data: CommissionSettings }>("/admin/settings/commissions"),
    apiFetch<{ data: DepositSettings }>("/admin/settings/deposits"),
  ]);
  const { totals } = revenue;
  const filters = { periode: period, annee: year };
  const years = Array.from({ length: currentYear - FIRST_YEAR + 1 }, (_, i) => currentYear - i);

  return (
    <div>
      <PageHeader
        title="Revenus RESI"
        description="Ce que RESI garde : commissions sur les réservations en ligne, abonnements et frais de retrait, moins les gains de parrainage versés."
        actions={
          <>
            <DepositSettingsButton settings={deposit} />
            <CommissionSettingsButton settings={settings} />
          </>
        }
      />

      <Section title="Commission" icon={Percent} className="mb-6">
        <DetailList
          items={[
            [
              "État",
              settings.enabled ? (
                <Badge tone={STATUS_TONES.done}>Activée</Badge>
              ) : (
                <Badge tone={STATUS_TONES.idle}>Coupée</Badge>
              ),
            ],
            ["Règle", describeCommission(settings)],
            ["Code promo", "Pris sur la part de RESI : le propriétaire touche toujours son prix."],
          ]}
        />
      </Section>

      <Section title="Acompte" icon={Wallet} className="mb-6">
        <DetailList
          items={[
            [
              "État",
              deposit.enabled ? (
                <Badge tone={STATUS_TONES.done}>Proposé</Badge>
              ) : (
                <Badge tone={STATUS_TONES.idle}>Coupé</Badge>
              ),
            ],
            ["Règle", describeDeposit(deposit)],
            [
              "Réglé par",
              deposit.owner_can_set
                ? "Chaque propriétaire, logement par logement"
                : "RESI, pour tous",
            ],
            [
              "Commission",
              "Retenue en entier sur l'acompte : il n'est jamais inférieur à la part de RESI.",
            ],
          ]}
        />
      </Section>

      <FilterBar
        key={JSON.stringify(filters)}
        path="/revenus"
        active={period !== "annee" || year !== currentYear}
      >
        <Select
          label="Période"
          name="periode"
          defaultValue={period}
          options={PERIODS.map((value) => ({ value, label: REVENUE_PERIODS[value] }))}
        />
        <Select
          label="Année (vue annuelle)"
          name="annee"
          defaultValue={String(year)}
          options={years.map((value) => ({ value: String(value), label: String(value) }))}
        />
      </FilterBar>

      <p className="mb-3 text-sm text-muted">
        Du {formatDate(window.from)} au {formatDate(window.to)}
      </p>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Revenu net"
          value={formatPrice(totals.net)}
          icon={Coins}
          accent={totals.net < 0 ? "red" : "green"}
        />
        <StatTile
          label="Commissions"
          value={formatPrice(totals.commissions)}
          icon={Percent}
          accent="violet"
          note={`${formatNumber(revenue.commissioned_bookings)} réservation(s) payée(s)`}
        />
        <StatTile
          label="Abonnements et frais de retrait"
          value={formatPrice(totals.subscriptions + totals.withdrawal_fees)}
          icon={Receipt}
          accent="blue"
          note={`Dont frais de retrait : ${formatPrice(totals.withdrawal_fees)}`}
        />
        <StatTile
          label="Parrainage versé"
          value={formatPrice(-totals.sponsorship_rewards)}
          icon={SECTION_ICONS.sponsorships}
          accent="amber"
        />
      </div>

      <Section title="Détail" icon={ArrowDownUp}>
        {revenue.series.length === 0 ? (
          <EmptyState>Aucune période à afficher.</EmptyState>
        ) : (
          <Table
            head={["Période", "Commissions", "Abonnements", "Frais de retrait", "Parrainage", "Net"]}
          >
            {revenue.series.map((point) => (
              <Row key={point.period}>
                <Cell>{periodLabel(point.period, revenue.granularity)}</Cell>
                <Cell>
                  <Amount value={point.commissions} />
                </Cell>
                <Cell>
                  <Amount value={point.subscriptions} />
                </Cell>
                <Cell>
                  <Amount value={point.withdrawal_fees} />
                </Cell>
                <Cell>
                  <Amount value={point.sponsorship_rewards} />
                </Cell>
                <Cell>
                  <span className="font-medium">
                    <Amount value={point.net} />
                  </span>
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}
