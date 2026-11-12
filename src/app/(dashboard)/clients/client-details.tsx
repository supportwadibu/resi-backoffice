"use client";

import { BedDouble, Eye, UserRound } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Badge } from "@/components/badge";
import { Dialog } from "@/components/dialog";
import { IconButton } from "@/components/icon-button";
import { DetailList } from "@/components/page-header";
import type { PlatformClient } from "@/lib/api/types";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";

/** Détail d'un client : coordonnées, propriétaires, et chaque logement où il a séjourné. */
export function ClientDetails({ client }: { client: PlatformClient }) {
  const [open, setOpen] = useState(false);
  const owners = new Map(client.owners.map((owner) => [owner.id, owner]));

  return (
    <>
      <IconButton icon={Eye} label="Voir le détail" onClick={() => setOpen(true)} />

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={client.full_name || "Sans nom"}
        description={<ClientKindBadge kind={client.kind} />}
        className="max-w-2xl"
      >
        <div className="space-y-6">
          <DetailList
            items={[
              ["Téléphone", client.phone ?? "—"],
              ["E-mail", client.email ?? "—"],
              ["Séjours", formatNumber(client.stays)],
              ["Total payé", formatPrice(client.total_paid)],
              ["Dernier séjour", client.last_stay_at ? formatDate(client.last_stay_at) : "Aucun"],
              ...(client.kind === "account"
                ? [
                    [
                      "Compte",
                      <Link key="compte" href={`/comptes/${client.id}`} className="underline-offset-4 hover:underline">
                        Ouvrir la fiche du compte
                      </Link>,
                    ] as [string, ReactNode],
                  ]
                : []),
            ]}
          />

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <UserRound aria-hidden className="size-4 text-muted" />
              {client.kind === "carnet" ? "Carnet de" : "Propriétaires"}
            </h3>
            {client.owners.length === 0 ? (
              <p className="text-sm text-muted">
                {client.kind === "carnet" ? "Propriétaire introuvable." : "Aucune réservation pour l'instant."}
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {client.owners.map((owner) => (
                  <li key={owner.id}>
                    <Link
                      href={`/proprietaires/${owner.id}`}
                      className="inline-flex items-center gap-2 border border-border px-3 py-1.5 text-sm hover:bg-background"
                    >
                      {owner.full_name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <BedDouble aria-hidden className="size-4 text-muted" />
              Logements
            </h3>
            {client.properties.length === 0 ? (
              <p className="text-sm text-muted">Aucun séjour enregistré.</p>
            ) : (
              <ul className="divide-y divide-border border border-border">
                {client.properties.map(({ property, owner_id: ownerId, stays, last_stay_at: lastStay }) => (
                  <li key={property.id} className="flex items-center gap-3 p-3">
                    {property.image ? (
                      // Photo hébergée chez Cloudinary, hors de l'optimiseur de Next.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={property.image} alt="" className="size-12 shrink-0 object-cover" />
                    ) : (
                      <span aria-hidden className="flex size-12 shrink-0 items-center justify-center bg-background text-muted">
                        <BedDouble className="size-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/logements/${property.id}`}
                        className="block truncate font-medium underline-offset-4 hover:underline"
                      >
                        {property.title}
                        {property.unit_label && <span className="text-muted"> · {property.unit_label}</span>}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {[property.city, owners.get(ownerId)?.full_name].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <p className="font-medium tabular-nums">
                        {stays} séjour{stays > 1 ? "s" : ""}
                      </p>
                      <p className="text-muted">dernier le {formatDate(lastStay)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Dialog>
    </>
  );
}

/** Fiche saisie par un propriétaire, ou compte de l'application client. */
export function ClientKindBadge({ kind }: { kind: PlatformClient["kind"] }) {
  return kind === "carnet" ? <Badge tone="violet">Carnet</Badge> : <Badge tone="blue">Compte app</Badge>;
}
