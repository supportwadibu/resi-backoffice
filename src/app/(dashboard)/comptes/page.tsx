import type { Metadata } from "next";

import { FilterBar } from "@/components/filter-bar";
import { Input } from "@/components/input";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Select } from "@/components/select";
import { ActiveBadge, OwnerStatusBadge } from "@/components/status-badges";
import { Cell, PersonCell, Row, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { Owner, Paginated, RoleName, User } from "@/lib/api/types";
import { formatDate, formatOptionalDate } from "@/lib/format";
import { ROLE_LABELS, toOptions } from "@/lib/labels";
import { boolParam, enumParam, pageParam, param } from "@/lib/search-params";

import { CreateUser } from "./create-user";

export const metadata: Metadata = { title: "Comptes" };

const ROLES = Object.keys(ROLE_LABELS) as RoleName[];

export default async function ComptesPage({ searchParams }: PageProps<"/comptes">) {
  const params = await searchParams;
  const filters = {
    role: enumParam(params, "role", ROLES),
    is_active: boolParam(params, "is_active"),
    q: param(params, "q"),
  };

  const [{ data: users, meta }, { data: owners }] = await Promise.all([
    apiFetch<Paginated<User>>("/admin/users", {
      query: { ...filters, page: pageParam(params), per_page: 25 },
    }),
    // Propriétaires proposés à la création d'un gérant. Plafond de l'API :
    // au-delà de 100, la liste deviendra une recherche.
    apiFetch<Paginated<Owner>>("/admin/owners", { query: { per_page: 100 } }),
  ]);

  const ownerOptions = owners.map((owner) => ({
    id: owner.id,
    label: [owner.full_name, owner.email ?? owner.phone].filter(Boolean).join(" · "),
  }));

  const active = Object.values(filters).some((value) => value !== undefined);

  return (
    <div>
      <PageHeader
        title="Comptes"
        description="Tous les comptes de la plateforme, tous rôles confondus."
        actions={<CreateUser owners={ownerOptions} />}
      />

      <FilterBar key={JSON.stringify(filters)} path="/comptes" active={active}>
        <Input
          label="Recherche"
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Nom, e-mail ou téléphone"
        />
        <Select
          label="Rôle"
          name="role"
          defaultValue={filters.role ?? ""}
          placeholder="Tous"
          options={toOptions(ROLE_LABELS)}
        />
        <Select
          label="État"
          name="is_active"
          defaultValue={filters.is_active === undefined ? "" : String(filters.is_active)}
          placeholder="Tous"
          options={[
            { value: "true", label: "Actifs" },
            { value: "false", label: "Désactivés" },
          ]}
        />
      </FilterBar>

      {users.length === 0 ? (
        <EmptyState>Aucun compte ne correspond à ces critères.</EmptyState>
      ) : (
        <Table head={["Nom", "Rôle", "État", "Dernière connexion", "Inscription"]}>
          {users.map((user) => (
            <Row key={user.id}>
              <Cell>
                <PersonCell
                  name={user.full_name}
                  contact={user.email ?? user.phone}
                  href={`/comptes/${user.id}`}
                />
              </Cell>
              <Cell>
                <div className="flex flex-wrap items-center gap-2">
                  {ROLE_LABELS[user.role]}
                  {user.owner_status && <OwnerStatusBadge status={user.owner_status} />}
                </div>
              </Cell>
              <Cell>
                <ActiveBadge active={user.is_active} />
              </Cell>
              <Cell className="whitespace-nowrap">{formatOptionalDate(user.last_login_at)}</Cell>
              <Cell className="whitespace-nowrap">{formatDate(user.created_at)}</Cell>
            </Row>
          ))}
        </Table>
      )}

      <Pagination meta={meta} path="/comptes" filters={filters} noun={["compte", "comptes"]} />
    </div>
  );
}
