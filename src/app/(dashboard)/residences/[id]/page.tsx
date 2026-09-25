import { Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DetailList, EmptyState, PageHeader, Section } from "@/components/page-header";
import { PropertySummaryTable } from "@/components/property-summary-table";
import { apiFetchOrNotFound } from "@/lib/api/client";
import type { PlatformResidence } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Résidence" };

const AMENITY_LABELS: Record<string, string> = {
  pool: "Piscine",
  gym: "Salle de sport",
  security: "Sécurité",
  concierge: "Conciergerie",
  elevator: "Ascenseur",
  parking: "Parking",
  garden: "Jardin",
  wifi: "Wi-Fi",
};

export default async function ResidenceDetailPage({ params }: PageProps<"/residences/[id]">) {
  const { id } = await params;
  const { data: residence } = await apiFetchOrNotFound<{ data: PlatformResidence }>(
    `/admin/residences/${encodeURIComponent(id)}`,
  );

  const amenities = Object.entries(residence.amenities)
    .filter(([, present]) => present)
    .map(([key]) => AMENITY_LABELS[key] ?? key);
  const { address } = residence;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/residences", label: "Résidences" }}
        title={residence.name}
        description={address.city}
      />

      <Section title="Informations" icon={Info}>
        <DetailList
          items={[
            [
              "Propriétaire",
              residence.owner ? (
                <Link href={`/proprietaires/${residence.owner.id}`} className="underline-offset-4 hover:underline">
                  {residence.owner.full_name}
                </Link>
              ) : (
                "Introuvable"
              ),
            ],
            ["Adresse", [address.street, address.city, address.country].filter(Boolean).join(", ")],
            ["Équipements", amenities.length > 0 ? amenities.join(", ") : "Aucun renseigné"],
            ["Création", formatDate(residence.created_at)],
          ]}
        />
        {residence.description && <p className="mt-4 text-sm whitespace-pre-line">{residence.description}</p>}
      </Section>

      <section>
        <h2 className="mb-4 font-semibold">Unités ({residence.units.length})</h2>
        {residence.units.length === 0 ? (
          <EmptyState>Aucune unité rattachée à cette résidence.</EmptyState>
        ) : (
          <PropertySummaryTable properties={residence.units} />
        )}
      </section>
    </div>
  );
}
