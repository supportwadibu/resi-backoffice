import { Banknote, Building2, Eye, FileText, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/badge";
import { ButtonLink } from "@/components/button";
import { DetailList, EmptyState, PageHeader, Section } from "@/components/page-header";
import { SECTION_ICONS } from "@/components/shell/navigation";
import { BookingStatusBadge, PropertyStatusBadge } from "@/components/status-badges";
import { Cell, PersonCell, Row, RowLink, Table } from "@/components/table";
import { apiFetchOrNotFound } from "@/lib/api/client";
import type { PlatformProperty, PropertyClients } from "@/lib/api/types";
import { formatDate, formatNumber, formatOptionalDate, formatPrice } from "@/lib/format";
import { CLIENT_KIND_LABELS, FURNISHING_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Logement" };

export default async function LogementDetailPage({ params }: PageProps<"/logements/[id]">) {
  const { id } = await params;
  const base = `/admin/properties/${encodeURIComponent(id)}`;
  const [{ data: property }, clients] = await Promise.all([
    apiFetchOrNotFound<{ data: PlatformProperty }>(base),
    apiFetchOrNotFound<PropertyClients>(`${base}/clients`),
  ]);

  const { details, pricing, address } = property;
  const images = property.media.images ?? [];
  const tiers = pricing.price_tiers ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/logements", label: "Logements" }}
        title={property.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <PropertyStatusBadge status={property.status} />
            {PROPERTY_TYPE_LABELS[property.property_type]}
            {property.unit_label && <span>· {property.unit_label}</span>}
            {property.visibility.featured && <Badge tone="violet">Mis en avant</Badge>}
          </span>
        }
        actions={
          <ButtonLink href={`/reservations?property_id=${property.id}`}>
            <SECTION_ICONS.bookings aria-hidden className="size-4" />
            Réservations
          </ButtonLink>
        }
      />

      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- images hébergées hors du domaine, sans configuration d'optimiseur
            <img key={src} src={src} alt={`Photo ${index + 1}`} className="h-40 w-auto shrink-0 border border-border object-cover" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Rattachement" icon={Building2}>
          <DetailList
            items={[
              [
                "Propriétaire",
                property.owner ? (
                  <Link href={`/proprietaires/${property.owner.id}`} className="underline-offset-4 hover:underline">
                    {property.owner.full_name}
                  </Link>
                ) : (
                  "Introuvable"
                ),
              ],
              [
                "Résidence",
                property.residence ? (
                  <Link href={`/residences/${property.residence.id}`} className="underline-offset-4 hover:underline">
                    {property.residence.name}
                  </Link>
                ) : property.residence_id ? (
                  "Résidence supprimée"
                ) : (
                  "Logement autonome"
                ),
              ],
              ["Adresse", [address.street, address.city, address.country].filter(Boolean).join(", ")],
              ["Disponible dès le", formatDate(property.available_from)],
              ["Publié le", formatOptionalDate(property.visibility.published_at)],
              ["Visible au public", property.visibility.is_public ? "Oui" : "Non"],
            ]}
          />
        </Section>

        <Section title="Tarification" icon={Banknote}>
          <DetailList
            items={[
              ["Prix par jour", formatPrice(pricing.daily_price)],
              [
                "Remises de durée",
                tiers.length > 0
                  ? tiers
                      .map((tier) => `−${tier.discount_percent} % dès ${tier.min_days} jours`)
                      .join(" · ")
                  : "Aucune",
              ],
              ["Séjour minimum", pricing.minimum_stay_days ? `${pricing.minimum_stay_days} jours` : null],
              ["Séjour maximum", pricing.maximum_stay_days ? `${pricing.maximum_stay_days} jours` : null],
              ["Charges", property.charges_included ? "Incluses" : formatPrice(property.additional_charges)],
            ]}
          />
        </Section>

        <Section title="Caractéristiques" icon={ListChecks}>
          <DetailList
            items={[
              ["Surface", details.surface_area ? `${details.surface_area} m²` : null],
              ["Chambres", details.bedrooms],
              ["Salles de bain", details.bathrooms],
              ["Salons", details.living_rooms],
              ["Cuisines", details.kitchens],
              ["Places de parking", details.parking_spaces],
              ["Ameublement", details.furnishing ? FURNISHING_LABELS[details.furnishing] : null],
            ]}
          />
        </Section>

        <Section title="Audience" icon={Eye}>
          <DetailList
            items={[
              ["Vues", formatNumber(property.metadata.views_count)],
              ["Demandes de contact", formatNumber(property.metadata.contact_requests_count)],
              ["Dernière vue", formatOptionalDate(property.metadata.last_viewed_at)],
              ["Créé le", formatDate(property.created_at)],
            ]}
          />
        </Section>
      </div>

      {property.description && (
        <Section title="Description" icon={FileText}>
          <p className="text-sm whitespace-pre-line">{property.description}</p>
        </Section>
      )}

      <section>
        <h2 className="mb-1 font-semibold">Clients</h2>
        <p className="mb-4 text-sm text-muted">
          Personnes ayant réservé ce logement, en ligne ou au comptoir. Les séjours et montants excluent les
          annulations.
        </p>
        {clients.data.length === 0 ? (
          <EmptyState>Aucune réservation sur ce logement.</EmptyState>
        ) : (
          <Table head={["Client", "Origine", "Séjours", "Total payé", "Dernière réservation"]}>
            {clients.data.map((client) => (
              <Row key={`${client.kind}-${client.client_id}`}>
                <Cell>
                  <PersonCell
                    name={client.full_name}
                    contact={client.phone ?? client.email}
                    // Seul un compte a une fiche dans le backoffice ; une
                    // fiche du carnet appartient au propriétaire.
                    href={client.kind === "account" ? `/comptes/${client.client_id}` : undefined}
                  />
                </Cell>
                <Cell>{CLIENT_KIND_LABELS[client.kind]}</Cell>
                <Cell className="tabular-nums">
                  {formatNumber(client.stats.total_stays)}
                  {client.bookings_count !== client.stats.total_stays && (
                    <span className="text-muted"> / {formatNumber(client.bookings_count)} réservations</span>
                  )}
                </Cell>
                <Cell className="whitespace-nowrap tabular-nums">{formatPrice(client.stats.total_paid)}</Cell>
                <Cell>
                  <div className="flex flex-wrap items-center gap-2">
                    <RowLink href={`/reservations/${client.last_booking.id}`}>
                      {formatDate(client.last_booking.start_date)}
                    </RowLink>
                    <BookingStatusBadge status={client.last_booking.status} />
                  </div>
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </section>
    </div>
  );
}
