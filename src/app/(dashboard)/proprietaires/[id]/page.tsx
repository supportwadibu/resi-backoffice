import { ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/button";
import { DetailList, EmptyState, PageHeader, Section } from "@/components/page-header";
import { PropertySummaryTable } from "@/components/property-summary-table";
import { SECTION_ICONS } from "@/components/shell/navigation";
import { ActiveBadge, OwnerStatusBadge } from "@/components/status-badges";
import { apiFetchOrNotFound } from "@/lib/api/client";
import type { Owner, OwnerPortfolio, OwnerProfile } from "@/lib/api/types";
import { formatDate, formatDateTime, formatNumber, formatOptionalDate } from "@/lib/format";
import { ID_DOCUMENT_LABELS } from "@/lib/labels";

import { OwnerActions } from "./owner-actions";

export const metadata: Metadata = { title: "Propriétaire" };

export default async function ProprietaireDetailPage({ params }: PageProps<"/proprietaires/[id]">) {
  const { id } = await params;
  const base = `/admin/owners/${encodeURIComponent(id)}`;
  const [{ data: owner }, { data: profile }, { data: portfolio }] = await Promise.all([
    apiFetchOrNotFound<{ data: Owner }>(base),
    apiFetchOrNotFound<{ data: OwnerProfile }>(`${base}/profile`),
    apiFetchOrNotFound<{ data: OwnerPortfolio }>(`${base}/portfolio`),
  ]);

  const address = [profile.address, profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/proprietaires", label: "Propriétaires" }}
        title={owner.full_name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <OwnerStatusBadge status={owner.owner_status} />
            <ActiveBadge active={owner.is_active} />
            {!owner.is_verified && <span>OTP non vérifié : validation impossible pour l&apos;instant.</span>}
          </span>
        }
        actions={<OwnerActions owner={owner} />}
      />

      <Section
        title="Compte"
        icon={UserRound}
        actions={
          <div className="flex flex-wrap gap-1">
            <ButtonLink variant="ghost" size="sm" href={`/comptes/${owner.id}`}>
              <SECTION_ICONS.users aria-hidden className="size-4" />
              Fiche du compte
            </ButtonLink>
            <ButtonLink variant="ghost" size="sm" href={`/abonnements?user_id=${owner.id}`}>
              <SECTION_ICONS.subscriptions aria-hidden className="size-4" />
              Abonnements
            </ButtonLink>
            <ButtonLink variant="ghost" size="sm" href={`/reservations?owner_id=${owner.id}`}>
              <SECTION_ICONS.bookings aria-hidden className="size-4" />
              Réservations
            </ButtonLink>
          </div>
        }
      >
        <DetailList
          items={[
            ["E-mail", owner.email],
            ["Téléphone", owner.phone],
            ["Validé le", formatOptionalDate(owner.validated_at)],
            ["Motif de rejet", owner.rejection_reason],
            ["Dernière connexion", owner.last_login_at ? formatDateTime(owner.last_login_at) : "Jamais"],
            ["Inscription", formatDate(owner.created_at)],
          ]}
        />
      </Section>

      <Section title="Dossier de validation" icon={ShieldCheck}>
        {profile.is_submitted ? (
          <div className="flex flex-col gap-6">
            <DetailList
              items={[
                ["Déposé le", formatOptionalDate(profile.submitted_at)],
                ["Nom déclaré", profile.full_name],
                ["Adresse", address || null],
                [
                  "Pièce d'identité",
                  profile.id_document_type ? ID_DOCUMENT_LABELS[profile.id_document_type] : null,
                ],
                ["Numéro", profile.id_document_number],
              ]}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <IdDocumentImage label="Recto" url={profile.id_document_front_url} />
              <IdDocumentImage label="Verso" url={profile.id_document_back_url} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Le propriétaire n&apos;a pas encore déposé son dossier.</p>
        )}
      </Section>

      <section>
        <h2 className="mb-1 font-semibold">Portefeuille</h2>
        <p className="mb-4 text-sm text-muted">
          {formatNumber(portfolio.totals.residences)} résidence{portfolio.totals.residences > 1 ? "s" : ""} ·{" "}
          {formatNumber(portfolio.totals.properties)} logement{portfolio.totals.properties > 1 ? "s" : ""}, dont{" "}
          {formatNumber(portfolio.totals.standalone)} hors résidence
        </p>

        {portfolio.totals.properties === 0 && portfolio.totals.residences === 0 ? (
          <EmptyState>Aucun logement publié ni en préparation.</EmptyState>
        ) : (
          <div className="flex flex-col gap-6">
            {portfolio.residences.map((residence) => (
              <div key={residence.id}>
                <h3 className="mb-2 text-sm font-semibold">
                  <Link href={`/residences/${residence.id}`} className="underline-offset-4 hover:underline">
                    {residence.name}
                  </Link>{" "}
                  <span className="font-normal text-muted">· {residence.address.city}</span>
                </h3>
                {residence.units.length > 0 ? (
                  <PropertySummaryTable properties={residence.units} />
                ) : (
                  <EmptyState>Aucune unité dans cette résidence.</EmptyState>
                )}
              </div>
            ))}
            {portfolio.standalone.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Logements hors résidence</h3>
                <PropertySummaryTable properties={portfolio.standalone} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Pièce d'identité en URL signée, à durée limitée.
 *
 * `<img>` plutôt que `next/image` : l'optimiseur conserverait en cache une
 * copie de la pièce au-delà de l'expiration de l'URL, et exigerait de
 * déclarer l'hébergeur dans la configuration.
 */
function IdDocumentImage({ label, url }: { label: string; url: string | null }) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm text-muted">{label}</figcaption>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block border border-border bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element -- voir le commentaire ci-dessus */}
          <img src={url} alt={`Pièce d'identité, ${label.toLowerCase()}`} className="max-h-72 w-full object-contain" />
        </a>
      ) : (
        <div className="flex h-32 items-center justify-center border border-dashed border-border text-sm text-muted">
          Non fourni
        </div>
      )}
    </figure>
  );
}
