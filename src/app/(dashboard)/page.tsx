import { ChartColumn, FileClock, MessageSquareWarning, Percent, Store, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { Breakdown, breakdownRows } from "@/components/breakdown";
import { PageHeader, Section } from "@/components/page-header";
import { SECTION_ICONS } from "@/components/shell/navigation";
import { StatTile } from "@/components/stat-tile";
import {
  BOOKING_TONES,
  OWNER_TONES,
  PROPERTY_TONES,
  SUBSCRIPTION_TONES,
} from "@/components/status-badges";
import { apiFetch } from "@/lib/api/client";
import type { PlatformStats, RevenueSeries } from "@/lib/api/types";
import { formatDateTime, formatNumber, formatPercent, formatPrice } from "@/lib/format";
import {
  BOOKING_SOURCE_LABELS,
  BOOKING_STATUS_LABELS,
  OWNER_STATUS_LABELS,
  PROPERTY_STATUS_LABELS,
  ROLE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/labels";

import { RevenueChart } from "./revenue-chart";

export default async function DashboardPage() {
  const [{ data: stats }, { data: series }] = await Promise.all([
    apiFetch<{ data: PlatformStats }>("/admin/stats"),
    apiFetch<{ data: RevenueSeries }>("/admin/stats/revenue", { query: { months: 12 } }),
  ]);

  const growth = stats.revenue.growth_percent;

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={`Toute la plateforme · chiffres du ${formatDateTime(stats.generated_at)}`}
      />

      <DashboardGroup title="Chiffres clés">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Revenu du mois"
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
          <Section title={`Revenu des ${series.months} derniers mois`} icon={ChartColumn}>
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
