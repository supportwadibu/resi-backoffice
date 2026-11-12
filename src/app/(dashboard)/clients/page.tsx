import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FilterBar } from "@/components/filter-bar";
import { Input } from "@/components/input";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ScopeHiddenInputs, ScopeNote } from "@/components/scope-note";
import { Cell, PersonCell, Row, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { PlatformClient, PlatformClientList } from "@/lib/api/types";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { enumParam, pageParam, param } from "@/lib/search-params";

import { ClientDetails, ClientKindBadge } from "./client-details";
import { ClientTransferActions } from "./client-transfer";

export const metadata: Metadata = { title: "Clients" };

const KINDS = ["carnet", "account"] as const;

/** Logements montrés dans la ligne ; le reste se lit dans le détail. */
const PROPERTIES_IN_ROW = 2;

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const params = await searchParams;
  const scope = { owner_id: param(params, "owner_id"), property_id: param(params, "property_id") };
  const kind = enumParam(params, "kind", KINDS);
  const q = param(params, "q");

  const { data: clients, meta, counts, truncated } = await apiFetch<PlatformClientList>("/admin/clients", {
    query: { ...scope, kind, q, page: pageParam(params), per_page: 25 },
  });

  const scopeLabels = [scope.owner_id && "un propriétaire", scope.property_id && "un logement"].filter(
    (label): label is string => Boolean(label),
  );
  // Les onglets gardent la recherche et le périmètre : seul le type change.
  const tabHref = (value?: (typeof KINDS)[number]) => {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries({ ...scope, q, kind: value })) if (val) query.set(key, val);
    const text = query.toString();
    return text ? `/clients?${text}` : "/clients";
  };
  const tabs = [
    { label: "Tous", count: counts.carnet + counts.account, value: undefined },
    { label: "Carnets", count: counts.carnet, value: "carnet" as const },
    { label: "Comptes app", count: counts.account, value: "account" as const },
  ];

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Fiches des carnets des propriétaires et comptes de l'application, avec les logements où ils ont séjourné."
        actions={<ClientTransferActions />}
      />

      <ScopeNote labels={scopeLabels} clearHref="/clients" />

      <nav aria-label="Type de client" className="mb-4 flex border-b border-border">
        {tabs.map((tab) => {
          const current = tab.value === kind;
          return (
            <Link
              key={tab.label}
              href={tabHref(tab.value)}
              aria-current={current ? "page" : undefined}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm ${
                current ? "border-primary font-medium" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="text-xs text-muted tabular-nums">{formatNumber(tab.count)}</span>
            </Link>
          );
        })}
      </nav>

      <FilterBar key={JSON.stringify({ q, kind, ...scope })} path="/clients" active={q !== undefined}>
        <ScopeHiddenInputs scope={{ ...scope, kind }} />
        <Input
          label="Recherche"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Nom, téléphone, propriétaire, logement"
        />
      </FilterBar>

      {truncated && (
        <p className="mb-4 flex items-center gap-2 text-sm text-accent-amber">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          Liste incomplète : la limite de lecture est atteinte.
        </p>
      )}

      {clients.length === 0 ? (
        <EmptyState>Aucun client ne correspond à ces critères.</EmptyState>
      ) : (
        <Table head={["Client", "Propriétaire", "Logements", "Séjours", "Total payé", "Dernier séjour", ""]}>
          {clients.map((client) => (
            <Row key={`${client.kind}:${client.id}`}>
              <Cell>
                <div className="flex items-start gap-2">
                  <PersonCell
                    name={client.full_name || null}
                    contact={client.phone ?? client.email}
                    href={client.kind === "account" ? `/comptes/${client.id}` : undefined}
                  />
                  <ClientKindBadge kind={client.kind} />
                </div>
              </Cell>
              <Cell>
                <Owners client={client} />
              </Cell>
              <Cell>
                <Properties client={client} />
              </Cell>
              <Cell className="tabular-nums">{formatNumber(client.stays)}</Cell>
              <Cell className="whitespace-nowrap tabular-nums">{formatPrice(client.total_paid)}</Cell>
              <Cell className="whitespace-nowrap">
                {client.last_stay_at ? formatDate(client.last_stay_at) : <span className="text-muted">Aucun</span>}
              </Cell>
              <Cell>
                <ClientDetails client={client} />
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination
        meta={meta}
        path="/clients"
        filters={{ ...scope, kind, q }}
        noun={["client", "clients"]}
      />
    </div>
  );
}

function Owners({ client }: { client: PlatformClient }) {
  if (client.owners.length === 0) return <span className="text-sm text-muted">—</span>;
  const [first, ...others] = client.owners;
  return (
    <div className="text-sm">
      <Link href={`/proprietaires/${first.id}`} className="underline-offset-4 hover:underline">
        {first.full_name}
      </Link>
      {others.length > 0 && <span className="text-muted"> et {others.length} autre{others.length > 1 ? "s" : ""}</span>}
    </div>
  );
}

function Properties({ client }: { client: PlatformClient }) {
  if (client.properties.length === 0) return <span className="text-sm text-muted">Aucun séjour</span>;
  const shown = client.properties.slice(0, PROPERTIES_IN_ROW);
  const rest = client.properties.length - shown.length;
  return (
    <ul className="space-y-0.5 text-sm">
      {shown.map(({ property }) => (
        <li key={property.id} className="max-w-56 truncate">
          <Link href={`/logements/${property.id}`} className="underline-offset-4 hover:underline">
            {property.title}
          </Link>
          {property.unit_label && <span className="text-muted"> · {property.unit_label}</span>}
        </li>
      ))}
      {rest > 0 && (
        <li className="text-xs text-muted">
          + {rest} autre{rest > 1 ? "s" : ""}, voir le détail
        </li>
      )}
    </ul>
  );
}
