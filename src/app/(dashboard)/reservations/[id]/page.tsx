import { Banknote, Clock, DoorOpen, MessageSquare, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { DetailList, PageHeader, Section } from "@/components/page-header";
import { BookingStatusBadge } from "@/components/status-badges";
import { apiFetchOrNotFound } from "@/lib/api/client";
import type { PlatformBooking } from "@/lib/api/types";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { BOOKING_SOURCE_LABELS, CLIENT_KIND_LABELS, STAY_TYPE_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Réservation" };

export default async function ReservationDetailPage({ params }: PageProps<"/reservations/[id]">) {
  const { id } = await params;
  const { data: booking } = await apiFetchOrNotFound<{ data: PlatformBooking }>(
    `/admin/bookings/${encodeURIComponent(id)}`,
  );

  // Le départ anticipé fige ce qui avait été vendu avant de réduire le séjour.
  const shortened = booking.planned_check_out_at !== undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/reservations", label: "Réservations" }}
        title={`Séjour du ${formatDate(booking.start_date)} au ${formatDate(booking.end_date)}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            {BOOKING_SOURCE_LABELS[booking.source ?? "online"]}
            {booking.stay_type && <span>· {STAY_TYPE_LABELS[booking.stay_type]}</span>}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Parties" icon={Users}>
          <DetailList
            items={[
              [
                "Logement",
                booking.property ? (
                  <InternalLink href={`/logements/${booking.property.id}`}>
                    {booking.property.unit_label ?? booking.property.title}
                  </InternalLink>
                ) : (
                  "Supprimé"
                ),
              ],
              [
                "Résidence",
                booking.residence ? (
                  <InternalLink href={`/residences/${booking.residence.id}`}>{booking.residence.name}</InternalLink>
                ) : null,
              ],
              [
                "Propriétaire",
                booking.owner ? (
                  <InternalLink href={`/proprietaires/${booking.owner.id}`}>{booking.owner.full_name}</InternalLink>
                ) : (
                  "Introuvable"
                ),
              ],
              [
                "Client",
                booking.client ? (
                  <span>
                    {booking.client.kind === "account" ? (
                      <InternalLink href={`/comptes/${booking.client.id}`}>{booking.client.full_name}</InternalLink>
                    ) : (
                      booking.client.full_name
                    )}
                    <span className="text-muted"> · {CLIENT_KIND_LABELS[booking.client.kind]}</span>
                  </span>
                ) : (
                  "Inconnu"
                ),
              ],
              ["Contact du client", booking.client ? (booking.client.phone ?? booking.client.email) : null],
            ]}
          />
        </Section>

        <Section title="Montants" icon={Banknote}>
          <DetailList
            items={[
              [
                "Tarif",
                `${formatPrice(booking.daily_price)} × ${booking.days_count} jour${booking.days_count > 1 ? "s" : ""}`,
              ],
              ["Sous-total", formatPrice(booking.subtotal_amount)],
              [
                "Remises",
                booking.discount_amount > 0
                  ? `−${formatPrice(booking.discount_amount)}${booking.promo_code ? ` (code ${booking.promo_code})` : ""}${
                      booking.duration_discount_percent > 0 ? ` · −${booking.duration_discount_percent} % de durée` : ""
                    }`
                  : "Aucune",
              ],
              ["Total", <strong key="total">{formatPrice(booking.total_amount)}</strong>],
              ["Attendu", booking.expected_amount !== undefined ? formatPrice(booking.expected_amount) : null],
              ["Encaissé", booking.received_amount !== undefined ? formatPrice(booking.received_amount) : null],
              ["Caution", booking.deposit_amount ? formatPrice(booking.deposit_amount) : null],
              ["Remboursé", booking.refunded_amount > 0 ? formatPrice(booking.refunded_amount) : null],
            ]}
          />
        </Section>

        <Section title="Déroulement" icon={Clock}>
          <DetailList
            items={[
              ["Entrée", booking.check_in_at ? formatDateTime(booking.check_in_at) : formatDate(booking.start_date)],
              ["Sortie prévue", booking.check_out_at ? formatDateTime(booking.check_out_at) : formatDate(booking.end_date)],
              ["Sortie constatée", booking.actual_check_out_at ? formatDateTime(booking.actual_check_out_at) : null],
              ["Terminée le", booking.completed_at ? formatDateTime(booking.completed_at) : null],
              ["Annulée le", booking.cancelled_at ? formatDateTime(booking.cancelled_at) : null],
              ["Motif d'annulation", booking.cancellation_reason],
              ["Créée le", formatDateTime(booking.created_at)],
            ]}
          />
        </Section>

        {shortened && (
          <Section title="Départ anticipé" icon={DoorOpen}>
            <DetailList
              items={[
                ["Sortie vendue", booking.planned_check_out_at ? formatDateTime(booking.planned_check_out_at) : null],
                ["Durée vendue", booking.planned_days_count ? `${booking.planned_days_count} jours` : null],
                [
                  "Montant vendu",
                  booking.planned_total_amount !== undefined ? formatPrice(booking.planned_total_amount) : null,
                ],
              ]}
            />
          </Section>
        )}
      </div>

      {booking.message && (
        <Section title="Message du client" icon={MessageSquare}>
          <p className="text-sm whitespace-pre-line">{booking.message}</p>
        </Section>
      )}
    </div>
  );
}

function InternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
