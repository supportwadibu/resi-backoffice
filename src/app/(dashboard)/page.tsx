import {
  CalendarClock,
  ChartColumn,
  FileClock,
  Hourglass,
  MessageSquareWarning,
  Percent,
  Repeat,
  Store,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

import { Breakdown, breakdownRows } from "@/components/breakdown";
import { PageHeader, Section } from "@/components/page-header";
import { SECTION_ICONS } from "@/components/shell/navigation";
import { StatTile } from "@/components/stat-tile";
import {
  BOOKING_TONES,
  OWNER_TONES,
  PLAN_TIER_TONES,
  PROPERTY_TONES,
  SUBSCRIPTION_TONES,
} from "@/components/status-badges";
import { apiFetch } from "@/lib/api/client";
import type { PlatformStats, RevenueSeries, SubscriptionRevenue } from "@/lib/api/types";
import { formatDateTime, formatNumber, formatPercent, formatPrice } from "@/lib/format";
import {
  BOOKING_SOURCE_LABELS,
  BOOKING_STATUS_LABELS,
  OWNER_STATUS_LABELS,
  PLAN_TIER_LABELS,
  PROPERTY_STATUS_LABELS,
  ROLE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/labels";

import { RevenueChart } from "./revenue-chart";
import { SubscriptionRevenueChart, type RevenueMonth } from "./subscription-revenue-chart";

export default async function DashboardPage() {
  const [{ data: stats }, { data: series }, { data: resi }] = await Promise.all([
    apiFetch<{ data: PlatformStats }>("/admin/stats"),
    apiFetch<{ data: RevenueSeries }>("/admin/stats/revenue", { query: { months: 12 } }),
    apiFetch<{ data: SubscriptionRevenue }>("/admin/stats/subscriptions", {
      query: { months_back: 12, months_ahead: 6 },
    }),
  ]);

  const growth = stats.revenue.growth_percent;
  const resiGrowth = resi.earned.growth_percent;
  const months = mergeMonths(resi);

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={`Revenus de RESI et activité de la plateforme · chiffres du ${formatDateTime(stats.generated_at)}`}
      />

      {/*
        Ce que RESI gagne : les abonnements des propriétaires. Les chiffres
        d'affaires plus bas appartiennent aux propriétaires, pas à RESI.
      */}
      <DashboardGroup title="Revenus de RESI · abonnements">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Encaissé ce mois"
            value={formatPrice(resi.earned.this_month)}
            icon={Wallet}
            accent="green"
            note={
              resiGrowth === null ? (
                `Mois précédent : ${formatPrice(resi.earned.previous_month)}`
              ) : (
                <>
                  {resiGrowth >= 0 ? (
                    <TrendingUp aria-hidden className="size-3.5" />
                  ) : (
                    <TrendingDown aria-hidden className="size-3.5" />
                  )}
                  {`${resiGrowth >= 0 ? "+" : ""}${resiGrowth.toFixed(1).replace(".", ",")} % sur le mois précédent`}
                </>
              )
            }
            tone={resiGrowth === null ? undefined : resiGrowth >= 0 ? "up" : "down"}
          />
          <StatTile
            label="Revenu mensuel récurrent"
            value={formatPrice(resi.recurring.mrr)}
            icon={Repeat}
            accent="violet"
            note={`${formatNumber(resi.recurring.paying_subscribers)} abonné${resi.recurring.paying_subscribers > 1 ? "s" : ""} payant${resi.recurring.paying_subscribers > 1 ? "s" : ""}`}
            href="/abonnements?status=active&is_trial=false"
          />
          <StatTile
            label={`Attendu sur ${resi.forecast.series.length} mois`}
            value={formatPrice(resi.forecast.total)}
            icon={CalendarClock}
            accent="blue"
            note={`Dont ${formatPrice(resi.forecast.series[0]?.amount ?? 0)} d'ici la fin du mois, si les abonnés renouvellent`}
          />
          <StatTile
            label="Essais en cours"
            value={formatNumber(resi.trials.in_progress)}
            icon={Hourglass}
            accent={resi.trials.ending_within_30_days > 0 ? "amber" : "neutral"}
            note={
              resi.trials.in_progress > 0
                ? `Potentiel ${formatPrice(resi.trials.potential_mrr_min)} à ${formatPrice(resi.trials.potential_mrr_max)} / mois · ${formatNumber(resi.trials.ending_within_30_days)} finissent sous 30 jours`
                : "Aucun essai à convertir"
            }
            href="/abonnements?status=trial"
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <Section title="Encaissé et attendu" icon={ChartColumn} className="xl:col-span-2">
            <p className="mb-4 text-sm text-muted">
              Paiements Wave confirmés, au mois du paiement · {formatPrice(resi.earned.total)} sur{" "}
              {resi.earned.series.length} mois. L&apos;attendu suppose que chaque abonné payant renouvelle au même prix.
            </p>
            <SubscriptionRevenueChart data={months} />
          </Section>
          <Breakdown
            title={`Abonnés payants par forfait · ${formatPrice(resi.recurring.mrr)} / mois`}
            icon={SECTION_ICONS.subscriptions}
            rows={breakdownRows(
              {
                basic: resi.recurring.by_tier.basic.subscribers,
                full: resi.recurring.by_tier.full.subscribers,
              },
              PLAN_TIER_LABELS,
            )}
            tones={PLAN_TIER_TONES}
            href={() => "/abonnements?status=active&is_trial=false"}
          />
        </div>
      </DashboardGroup>

      <DashboardGroup title="Activité des résidences" className="mt-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Chiffre d'affaires des propriétaires"
            value={formatPrice(stats.revenue.current_month)}
            icon={Wallet}
            accent="green"
            note={
              growth === null ? (
                `Mois précédent : ${formatPrice(stats.revenue.previous_month)}`
              ) : (
                <>
                  {growth >= 0 ? (
                    <TrendingUp aria-hidden className="size-3.5" />
                  ) : (
                    <TrendingDown aria-hidden className="size-3.5" />
                  )}
                  {`${growth >= 0 ? "+" : ""}${growth.toFixed(1).replace(".", ",")} % sur le mois précédent`}
                </>
              )
            }
            tone={growth === null ? undefined : growth >= 0 ? "up" : "down"}
          />
          <StatTile
            label="Taux d'occupation du mois"
            value={formatPercent(stats.occupancy_rate)}
            icon={Percent}
            accent="blue"
            note="Parc en ligne ou loué, jours écoulés"
          />
          <StatTile
            label="Réservations"
            value={formatNumber(stats.bookings.total)}
            icon={SECTION_ICONS.bookings}
            accent="violet"
            note={`${formatNumber(stats.bookings.by_status.in_progress)} en cours · ${formatNumber(stats.bookings.by_status.confirmed)} à venir`}
            href="/reservations"
          />
          <StatTile
            label="Comptes"
            value={formatNumber(stats.users.total)}
            icon={SECTION_ICONS.users}
            accent="blue"
            note={`+${formatNumber(stats.users.new_this_month)} ce mois-ci · ${formatNumber(stats.users.inactive)} désactivé${stats.users.inactive > 1 ? "s" : ""}`}
            href="/comptes"
          />
        </div>
      </DashboardGroup>

      <div className="mt-8 grid grid-cols-1 gap-x-3 gap-y-8 xl:grid-cols-3">
        <DashboardGroup title="Évolution" className="xl:col-span-2">
          <Section title={`Chiffre d'affaires des résidences · ${series.months} derniers mois`} icon={ChartColumn}>
            <p className="mb-4 text-sm text-muted">
              Revenu constaté au prorata des jours de séjour · total {formatPrice(series.total)}
            </p>
            <RevenueChart data={series.data} />
          </Section>
        </DashboardGroup>

        {/* Deux files d'attente : l'ambre ne s'allume que s'il reste à traiter. */}
        <DashboardGroup title="À traiter">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <StatTile
              label="Dossiers propriétaires en attente"
              value={formatNumber(stats.owners.pending)}
              icon={FileClock}
              accent={stats.owners.pending > 0 ? "amber" : "neutral"}
              note="À examiner puis valider ou rejeter"
              href="/proprietaires?status=pending"
              tone={stats.owners.pending > 0 ? "attention" : undefined}
            />
            <StatTile
              label="Retours non lus"
              value={formatNumber(stats.feedbacks.new)}
              icon={MessageSquareWarning}
              accent={stats.feedbacks.new > 0 ? "amber" : "neutral"}
              note="Signalements et suggestions des utilisateurs"
              href="/retours?status=new"
              tone={stats.feedbacks.new > 0 ? "attention" : undefined}
            />
          </div>
        </DashboardGroup>
      </div>

      <DashboardGroup title="Répartitions" className="mt-8">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Breakdown
            title="Comptes par rôle"
            icon={SECTION_ICONS.users}
            rows={breakdownRows(stats.users.by_role, ROLE_LABELS)}
            href={(key) => `/comptes?role=${key}`}
          />
          <Breakdown
            title="Propriétaires par statut"
            icon={SECTION_ICONS.owners}
            rows={breakdownRows(stats.owners, OWNER_STATUS_LABELS)}
            tones={OWNER_TONES}
            href={(key) => `/proprietaires?status=${key}`}
          />
          <Breakdown
            title={`Catalogue · ${formatNumber(stats.catalog.residences)} résidences, ${formatNumber(stats.catalog.properties)} logements`}
            icon={SECTION_ICONS.residences}
            rows={breakdownRows(stats.catalog.properties_by_status, PROPERTY_STATUS_LABELS)}
            tones={PROPERTY_TONES}
            href={(key) => `/logements?status=${key}`}
          />
          <Breakdown
            title="Réservations par statut"
            icon={SECTION_ICONS.bookings}
            rows={breakdownRows(stats.bookings.by_status, BOOKING_STATUS_LABELS)}
            tones={BOOKING_TONES}
            href={(key) => `/reservations?status=${key}`}
          />
          <Breakdown
            title="Réservations par canal"
            icon={Store}
            rows={breakdownRows(stats.bookings.by_source, BOOKING_SOURCE_LABELS)}
          />
          <Breakdown
            title="Abonnements par statut"
            icon={SECTION_ICONS.subscriptions}
            rows={breakdownRows(stats.subscriptions, SUBSCRIPTION_STATUS_LABELS)}
            tones={SUBSCRIPTION_TONES}
            href={(key) => `/abonnements?status=${key}`}
          />
        </div>
      </DashboardGroup>
    </div>
  );
}

/**
 * Réunit l'encaissé des mois passés et l'attendu des mois à venir en une
 * série. Le mois en cours figure dans les deux : ce qui est reçu, et ce qui
 * reste à venir d'ici sa fin.
 */
function mergeMonths(resi: SubscriptionRevenue): RevenueMonth[] {
  const months = new Map<string, RevenueMonth>();
  const at = (month: string) => {
    const existing = months.get(month);
    if (existing) return existing;
    const created = { month, earned: 0, payments: 0, expected: 0, renewals: 0 };
    months.set(month, created);
    return created;
  };

  for (const point of resi.earned.series) {
    Object.assign(at(point.month), { earned: point.amount, payments: point.count });
  }
  for (const point of resi.forecast.series) {
    Object.assign(at(point.month), { expected: point.amount, renewals: point.count });
  }

  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** Groupe de tuiles sous un intitulé discret. */
function DashboardGroup({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-xs font-medium tracking-wider text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}
