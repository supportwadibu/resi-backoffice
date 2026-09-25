import { IdCard, UserCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/badge";
import { ButtonLink } from "@/components/button";
import { DetailList, PageHeader, Section } from "@/components/page-header";
import { SECTION_ICONS } from "@/components/shell/navigation";
import { ActiveBadge, OwnerStatusBadge, SubscriptionStatusBadge } from "@/components/status-badges";
import { apiFetchOrNotFound } from "@/lib/api/client";
import type { UserDetail } from "@/lib/api/types";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatOptionalDate, formatPrice } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/labels";

import { UserActions } from "./user-actions";

export const metadata: Metadata = { title: "Compte" };

const AUTH_CHANNEL_LABELS = { email: "E-mail", phone: "Téléphone", google: "Google" } as const;

export default async function CompteDetailPage({ params }: PageProps<"/comptes/[id]">) {
  const { id } = await params;
  const [{ data: user }, me] = await Promise.all([
    apiFetchOrNotFound<{ data: UserDetail }>(`/admin/users/${encodeURIComponent(id)}`),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/comptes", label: "Comptes" }}
        title={user.full_name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {ROLE_LABELS[user.role]}
            <ActiveBadge active={user.is_active} />
            {user.owner_status && <OwnerStatusBadge status={user.owner_status} />}
          </span>
        }
        actions={<UserActions user={user} isSelf={user.id === me.id} />}
      />

      <Section title="Identité" icon={IdCard}>
        <DetailList
          items={[
            ["E-mail", user.email],
            ["Téléphone", user.phone],
            ["Inscription par", AUTH_CHANNEL_LABELS[user.auth_channel]],
            ["Vérifié", user.is_verified ? "Oui" : "Non"],
            ["Sessions ouvertes", user.active_sessions],
            ["Dernière connexion", user.last_login_at ? formatDateTime(user.last_login_at) : "Jamais"],
            ["Inscription", formatDate(user.created_at)],
          ]}
        />
      </Section>

      {user.owner && (
        <Section
          title="Propriétaire"
          icon={UserCheck}
          actions={
            <ButtonLink variant="ghost" size="sm" href={`/proprietaires/${user.id}`}>
              <SECTION_ICONS.owners aria-hidden className="size-4" />
              Dossier et portefeuille
            </ButtonLink>
          }
        >
          <DetailList
            items={[
              ["Dossier", user.owner.profile_submitted ? "Déposé" : "Non déposé"],
              ["Validé le", formatOptionalDate(user.owner.validated_at)],
              ["Motif de rejet", user.owner.rejection_reason],
              [
                "Abonnement",
                user.owner.subscription ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <SubscriptionStatusBadge status={user.owner.subscription.status} />
                    {user.owner.subscription.is_trial && <Badge>Essai</Badge>}
                    <span>
                      {formatPrice(user.owner.subscription.amount)} · jusqu&apos;au{" "}
                      {formatDate(user.owner.subscription.end_date)}
                    </span>
                  </span>
                ) : (
                  "Aucun"
                ),
              ],
            ]}
          />
        </Section>
      )}

      {user.manager_assignment && (
        <Section title="Gérant" icon={UserRound}>
          <DetailList
            items={[
              [
                "Pour le compte de",
                user.manager_assignment.owner ? (
                  <Link href={`/proprietaires/${user.manager_assignment.owner_id}`} className="underline-offset-4 hover:underline">
                    {user.manager_assignment.owner.full_name}
                  </Link>
                ) : (
                  "Propriétaire introuvable"
                ),
              ],
              ["Logements confiés", user.manager_assignment.property_ids.length],
              ["Affectation", user.manager_assignment.is_active ? "Active" : "Suspendue"],
            ]}
          />
        </Section>
      )}
    </div>
  );
}
