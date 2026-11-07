import type { Metadata } from "next";

import { FilterBar } from "@/components/filter-bar";
import { Input } from "@/components/input";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Select } from "@/components/select";
import { AuditOutcomeBadge } from "@/components/status-badges";
import { Cell, PersonCell, Row, RowLink, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { AuditLog, AuditMethod, AuditOutcome, Paginated, RoleName } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/format";
import { AUDIT_METHOD_LABELS, AUDIT_OUTCOME_LABELS, ROLE_LABELS, toOptions } from "@/lib/labels";
import { dayParam, enumParam, pageParam, param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Journal d'audit" };

const OUTCOMES = Object.keys(AUDIT_OUTCOME_LABELS) as AuditOutcome[];
const METHODS = Object.keys(AUDIT_METHOD_LABELS) as AuditMethod[];
const ROLES = Object.keys(ROLE_LABELS) as RoleName[];

export default async function JournalPage({ searchParams }: PageProps<"/journal">) {
  const params = await searchParams;
  const from = dayParam(params, "from");
  const to = dayParam(params, "to");
  const filters = {
    outcome: enumParam(params, "outcome", OUTCOMES),
    method: enumParam(params, "method", METHODS),
    actor_role: enumParam(params, "actor_role", ROLES),
    actor_id: param(params, "actor_id"),
    from,
    // Une fin avant le début serait refusée par l'API : elle est ignorée.
    to: to && from && to < from ? undefined : to,
  };

  const { data: logs, meta } = await apiFetch<Paginated<AuditLog>>("/admin/audit-logs", {
    query: { ...filters, page: pageParam(params), per_page: 50 },
  });

  return (
    <div>
      <PageHeader
        title="Journal d'audit"
        description="Chaque requête reçue par l'API : qui, quoi, quand, avec quelle issue et, en cas d'échec, pourquoi."
      />

      <FilterBar
        key={JSON.stringify(filters)}
        path="/journal"
        active={Object.values(filters).some((value) => value !== undefined)}
      >
        <Select
          label="Issue"
          name="outcome"
          defaultValue={filters.outcome ?? ""}
          placeholder="Toutes"
          options={toOptions(AUDIT_OUTCOME_LABELS)}
        />
        <Select
          label="Action"
          name="method"
          defaultValue={filters.method ?? ""}
          placeholder="Toutes"
          options={toOptions(AUDIT_METHOD_LABELS)}
        />
        <Select
          label="Rôle"
          name="actor_role"
          defaultValue={filters.actor_role ?? ""}
          placeholder="Tous"
          options={toOptions(ROLE_LABELS)}
        />
        <Input label="Compte (identifiant)" name="actor_id" defaultValue={filters.actor_id ?? ""} />
        <Input label="Du" type="date" name="from" defaultValue={filters.from ?? ""} />
        <Input label="Au" type="date" name="to" defaultValue={filters.to ?? ""} />
      </FilterBar>

      {logs.length === 0 ? (
        <EmptyState>Aucune trace ne correspond à ces critères.</EmptyState>
      ) : (
        <Table head={["Date", "Acteur", "Action", "Issue", "Durée"]}>
          {logs.map((log) => (
            <Row key={log.id}>
              <Cell className="whitespace-nowrap tabular-nums">
                <RowLink href={`/journal/${log.id}`}>{formatTimestamp(log.created_at)}</RowLink>
              </Cell>
              <Cell>
                {log.actor ? (
                  <PersonCell
                    name={log.actor.full_name ?? `Compte ${log.actor.id}`}
                    contact={[log.actor.role && ROLE_LABELS[log.actor.role], log.actor.contact]
                      .filter(Boolean)
                      .join(" · ")}
                    href={`/comptes/${log.actor.id}`}
                  />
                ) : (
                  <div>
                    <span className="text-muted">Anonyme</span>
                    <div className="text-xs text-muted tabular-nums">{log.ip_address}</div>
                  </div>
                )}
              </Cell>
              <Cell>
                <div className="text-xs text-muted">
                  {AUDIT_METHOD_LABELS[log.method as AuditMethod] ?? log.method}
                </div>
                <div className="font-mono text-xs break-all">
                  {log.method} {log.path ?? log.route}
                </div>
                {log.error && <div className="mt-1 max-w-md text-xs text-danger">{log.error.message}</div>}
              </Cell>
              <Cell>
                <AuditOutcomeBadge outcome={log.outcome} status={log.status} />
              </Cell>
              <Cell className="whitespace-nowrap text-muted tabular-nums">
                {log.duration_ms != null ? `${log.duration_ms} ms` : "—"}
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination meta={meta} path="/journal" filters={filters} noun={["trace", "traces"]} />
    </div>
  );
}
