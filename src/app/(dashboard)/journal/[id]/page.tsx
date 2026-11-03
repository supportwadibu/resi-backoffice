import { Activity, Globe, TriangleAlert, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DetailList, PageHeader, Section } from "@/components/page-header";
import { AuditOutcomeBadge } from "@/components/status-badges";
import { apiFetchOrNotFound } from "@/lib/api/client";
import type { AuditLog, AuditMethod } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/format";
import { AUDIT_METHOD_LABELS, ROLE_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Trace d'audit" };

const LINK = "underline-offset-4 hover:underline";

export default async function TraceDetailPage({ params }: PageProps<"/journal/[id]">) {
  const { id } = await params;
  const { data: log } = await apiFetchOrNotFound<{ data: AuditLog }>(
    `/admin/audit-logs/${encodeURIComponent(id)}`,
  );
  const { actor, error } = log;
  const routeParams = Object.entries(log.params);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/journal", label: "Journal d'audit" }}
        title={`${AUDIT_METHOD_LABELS[log.method as AuditMethod] ?? log.method} · ${log.route}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <AuditOutcomeBadge outcome={log.outcome} status={log.status} />
            {formatTimestamp(log.created_at)}
          </span>
        }
      />

      {error && (
        <Section title="Cause de l'échec" icon={TriangleAlert}>
          <DetailList
            items={[
              ["Code", error.code && <code key="code" className="font-mono text-xs">{error.code}</code>],
              ["Message", error.message],
              ["Champs refusés", error.details.length > 0 ? error.details.join(", ") : null],
            ]}
          />
          {error.stack && (
            <pre className="mt-4 overflow-x-auto border border-border bg-background p-3 font-mono text-xs whitespace-pre">
              {error.stack}
            </pre>
          )}
        </Section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <Section title="Requête" icon={Activity}>
          <DetailList
            items={[
              ["Méthode", <code key="method" className="font-mono text-xs">{log.method}</code>],
              ["Route", <code key="route" className="font-mono text-xs break-all">{log.route}</code>],
              ["Chemin", log.path && <code key="path" className="font-mono text-xs break-all">{log.path}</code>],
              [
                "Paramètres",
                routeParams.length > 0 ? (
                  <code key="params" className="font-mono text-xs break-all">
                    {routeParams.map(([key, value]) => `${key} = ${value}`).join(", ")}
                  </code>
                ) : null,
              ],
              ["Statut HTTP", String(log.status)],
              ["Durée", log.duration_ms != null ? `${log.duration_ms} ms` : null],
              [
                "Identifiant",
                log.request_id && <code key="request" className="font-mono text-xs break-all">{log.request_id}</code>,
              ],
            ]}
          />
        </Section>

        <div className="flex flex-col gap-6">
          <Section title="Acteur" icon={UserRound}>
            {actor ? (
              <DetailList
                items={[
                  [
                    "Nom",
                    <Link key="actor" href={`/comptes/${actor.id}`} className={LINK}>
                      {actor.full_name ?? `Compte ${actor.id}`}
                    </Link>,
                  ],
                  ["Rôle", actor.role && ROLE_LABELS[actor.role]],
                  ["Contact", actor.contact],
                  [
                    "Activité",
                    <Link key="activity" href={`/journal?actor_id=${encodeURIComponent(actor.id)}`} className={LINK}>
                      Toutes ses traces
                    </Link>,
                  ],
                ]}
              />
            ) : (
              <p className="text-sm text-muted">
                Requête anonyme : route publique, ou jeton absent ou refusé.
              </p>
            )}
          </Section>
          <Section title="Origine" icon={Globe}>
            <DetailList
              items={[
                ["Adresse IP", log.ip_address],
                ["Agent", <span key="agent" className="break-all">{log.user_agent}</span>],
              ]}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
