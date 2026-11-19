import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api/client";
import type { Owner, Paginated, Plan } from "@/lib/api/types";
import { param } from "@/lib/search-params";

import { GrantSubscriptionForm } from "./grant-subscription-form";

export const metadata: Metadata = { title: "Enregistrer un abonnement" };

/** Plafond de l'API par page de propriétaires. */
const PER_PAGE = 100;

/**
 * Tous les propriétaires, page après page : la liste à choisir doit être
 * complète, et l'API plafonne une page à 100. Le volume reste celui d'un
 * carnet de propriétaires, pas d'un fichier de clients.
 */
async function allOwners(): Promise<Owner[]> {
  const first = await apiFetch<Paginated<Owner>>("/admin/owners", {
    query: { page: 1, per_page: PER_PAGE },
  });
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.meta.lastPage - 1) }, (_, i) =>
      apiFetch<Paginated<Owner>>("/admin/owners", { query: { page: i + 2, per_page: PER_PAGE } }),
    ),
  );
  return [first, ...rest].flatMap((page) => page.data);
}

export default async function NouvelAbonnementPage({
  searchParams,
}: PageProps<"/abonnements/nouveau">) {
  const params = await searchParams;
  const [owners, { data: plans }] = await Promise.all([
    allOwners(),
    apiFetch<Paginated<Plan>>("/admin/plans", { query: { is_active: true, per_page: 100 } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Enregistrer un abonnement"
        description="Pour un paiement reçu hors application (espèces, virement) ou un abonnement offert. Rien n'est débité : le montant saisi est enregistré tel quel, après validation par un code envoyé à votre e-mail."
        back={{ href: "/abonnements", label: "Abonnements" }}
      />
      <GrantSubscriptionForm
        owners={owners
          .filter((owner) => owner.is_active)
          .sort((a, b) => a.full_name.localeCompare(b.full_name, "fr"))}
        plans={plans
          .filter((plan) => plan.is_active)
          .sort((a, b) => a.price - b.price)}
        initialOwnerId={param(params, "owner")}
      />
    </div>
  );
}
