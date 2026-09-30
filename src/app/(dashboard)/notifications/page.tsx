import type { Metadata } from "next";

import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Cell, Row, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { NotificationCampaign, Owner, Paginated } from "@/lib/api/types";
import { formatDateTime, formatNumber } from "@/lib/format";
import { pageParam } from "@/lib/search-params";

import { SendNotificationButton } from "./send-notification-button";

export const metadata: Metadata = { title: "Notifications" };

/**
 * Au-delà, la sélection ciblée ne proposerait qu'une partie du parc : la
 * borne suit le plafond des listes de l'API, dix pages de cent.
 */
const MAX_OWNER_PAGES = 10;

/** Tous les propriétaires, pour la sélection d'un envoi ciblé. */
async function loadOwners(): Promise<{ id: string; label: string }[]> {
  const owners: Owner[] = [];
  for (let page = 1; page <= MAX_OWNER_PAGES; page++) {
    const { data, meta } = await apiFetch<Paginated<Owner>>("/admin/owners", {
      query: { page, per_page: 100 },
    });
    owners.push(...data);
    if (page >= meta.lastPage) break;
  }
  return owners.map((owner) => ({
    id: owner.id,
    label: [owner.full_name, owner.phone ?? owner.email].filter(Boolean).join(" · "),
  }));
}

export default async function NotificationsPage({ searchParams }: PageProps<"/notifications">) {
  const params = await searchParams;
  // Arrivée depuis la fiche d'un propriétaire : le dialogue s'ouvre, ciblé.
  const target = typeof params.destinataire === "string" ? params.destinataire : undefined;

  const [{ data: campaigns, meta }, owners] = await Promise.all([
    apiFetch<Paginated<NotificationCampaign>>("/admin/notifications", {
      query: { page: pageParam(params), per_page: 25 },
    }),
    loadOwners(),
  ]);
  const ownerNames = new Map(owners.map((owner) => [owner.id, owner.label]));

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Notifications push aux propriétaires : à tous, ou à ceux que vous choisissez. Les relances d'échéance d'abonnement partent seules."
        actions={<SendNotificationButton owners={owners} initialOwnerId={target} />}
      />

      {campaigns.length === 0 ? (
        <EmptyState>Aucune notification envoyée pour l&apos;instant.</EmptyState>
      ) : (
        <Table head={["Envoyée le", "Message", "Destinataires", "Appareils"]}>
          {campaigns.map((campaign) => (
            <Row key={campaign.id}>
              <Cell className="whitespace-nowrap">{formatDateTime(campaign.created_at)}</Cell>
              <Cell>
                <p className="font-medium">{campaign.title}</p>
                <p className="line-clamp-2 text-sm text-muted">{campaign.body}</p>
              </Cell>
              <Cell>
                {campaign.audience === "all_owners"
                  ? "Tous les propriétaires"
                  : campaign.owner_ids.map((id) => ownerNames.get(id) ?? id).join(", ")}
              </Cell>
              <Cell className="whitespace-nowrap">
                {formatNumber(campaign.devices_sent)} reçue{campaign.devices_sent > 1 ? "s" : ""}
                {campaign.devices_failed > 0 && (
                  <span className="text-danger"> · {formatNumber(campaign.devices_failed)} en échec</span>
                )}
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination meta={meta} path="/notifications" filters={{}} noun={["notification", "notifications"]} />
    </div>
  );
}
