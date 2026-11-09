import { IdCard, Trash2, TriangleAlert, UserCheck, UserRound, UserX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/badge";
import { ButtonLink } from "@/components/button";
import { DetailList, PageHeader, Section } from "@/components/page-header";
import { SECTION_ICONS } from "@/components/shell/navigation";
import {
  AccountStatusBadge,
  OwnerStatusBadge,
  PlanTierBadge,
  SubscriptionStatusBadge,
} from "@/components/status-badges";
import { apiFetch, apiFetchOrNotFound } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { PurgeItem, PurgePreview, UserDetail } from "@/lib/api/types";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatOptionalDate, formatPrice } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/labels";

import { AccountExportButton } from "./account-export-button";
import { UserActions } from "./user-actions";

export const metadata: Metadata = { title: "Compte" };

const AUTH_CHANNEL_LABELS = { email: "E-mail", phone: "Téléphone", google: "Google" } as const;

export default async function CompteDetailPage({ params }: PageProps<"/comptes/[id]">) {
  const { id } = await params;
  const [{ data: user }, me] = await Promise.all([
    apiFetchOrNotFound<{ data: UserDetail }>(`/admin/users/${encodeURIComponent(id)}`),
    getCurrentUser(),
  ]);

  // Aperçu lu seulement pour un compte supprimé : une trentaine de comptages,
  // inutiles tant que la suppression définitive n'est pas proposée.
  const preview = user.deleted_at ? await loadPurgePreview(id) : null;
  const purge = preview && "data" in preview ? preview.data : null;
  const purgeCount = purge?.items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/comptes", label: "Comptes" }}
        title={user.full_name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {ROLE_LABELS[user.role]}
            <AccountStatusBadge active={user.is_active} verified={user.is_verified} deleted={user.deleted_at !== null}
              purgeScheduled={user.purge_scheduled_at !== null}
            />
            {user.owner_status && <OwnerStatusBadge status={user.owner_status} />}
          </span>
        }
        actions={
          <>
            <ButtonLink href={`/journal?actor_id=${encodeURIComponent(user.id)}`}>
              <SECTION_ICONS.auditLogs aria-hidden className="size-4" />
              Activité
            </ButtonLink>
            <AccountExportButton userId={user.id} />
            <UserActions user={user} isSelf={user.id === me.id} purgeCount={purgeCount} />
          </>
        }
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
            ...(user.deleted_at ? [["Supprimé le", formatDateTime(user.deleted_at)] as [string, string]] : []),
          ]}
        />
      </Section>

      {user.deletion_requested_by_user && (
        <Section title="Suppression demandée par l'utilisateur" icon={UserX}>
          <div className="flex flex-col gap-4 text-sm">
            <DetailList
              items={[
                ["Demandée le", user.deleted_at ? formatDateTime(user.deleted_at) : null],
                [
                  "Suppression définitive",
                  user.purge_scheduled_at ? formatDate(user.purge_scheduled_at) : null,
                ],
                ["Motif", user.deletion_reason ?? "Non précisé"],
              ]}
            />
            <p className="text-muted">
              Le compte sera effacé automatiquement à cette date. Le restaurer avant annule la
              suppression, par exemple si l&apos;utilisateur la regrette auprès du support.
            </p>
          </div>
        </Section>
      )}

      {preview && "error" in preview && (
        <Section title="Suppression définitive" icon={Trash2}>
          <p className="flex items-start gap-2 text-sm text-danger">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            Aperçu indisponible : {preview.error}
          </p>
        </Section>
      )}

      {purge && (
        <Section title="Suppression définitive" icon={Trash2}>
          <div className="flex flex-col gap-4 text-sm">
            {purge.warnings.length > 0 && (
              <ul className="flex flex-col gap-2">
                {purge.warnings.map((warning) => (
                  <li key={warning.code} className="flex items-start gap-2 text-accent-amber">
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                    {warning.message}
                  </li>
                ))}
              </ul>
            )}
            <PurgeList
              title="Effacé avec le compte"
              items={purge.items}
              empty="Aucune donnée rattachée : seul le compte sera effacé."
            />
            <p className="text-muted">
              Les photos d&apos;annonce et les pièces d&apos;identité sont effacées avec lui. Le journal
              d&apos;audit est conservé.
            </p>
            {purge.kept.length > 0 && (
              <PurgeList
                title="Conservé chez les propriétaires, au nom figé"
                items={purge.kept}
              />
            )}
          </div>
        </Section>
      )}

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
                    {user.owner.subscription.is_trial && (
                      <>
                        <Badge>Essai</Badge>
                        <PlanTierBadge tier={user.owner.subscription.plan_tier} />
                      </>
                    )}
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

/**
 * Aperçu de la suppression définitive, sans faire tomber la fiche s'il
 * échoue : restaurer le compte doit rester possible même quand l'aperçu,
 * fait d'une trentaine de requêtes, bute sur l'une d'elles.
 */
async function loadPurgePreview(id: string): Promise<{ data: PurgePreview } | { error: string }> {
  try {
    return await apiFetch<{ data: PurgePreview }>(`/admin/users/${encodeURIComponent(id)}/purge`);
  } catch (error) {
    // Seules les erreurs de l'API : la redirection d'un 401 doit se propager.
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

function PurgeList({ title, items, empty }: { title: string; items: PurgeItem[]; empty?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="text-muted">{empty}</p>
      ) : (
        <DetailList items={items.map((item) => [item.label, item.count])} />
      )}
    </div>
  );
}
