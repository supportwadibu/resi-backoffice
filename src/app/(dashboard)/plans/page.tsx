import type { Metadata } from "next";

import { Badge } from "@/components/badge";
import { EmptyState, PageHeader } from "@/components/page-header";
import { STATUS_TONES } from "@/components/status-badges";
import { Cell, Row, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { Paginated, Plan } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

import { CreatePlan, PlanRowActions } from "./plan-form";

export const metadata: Metadata = { title: "Plans" };

export default async function PlansPage() {
  const { data: plans } = await apiFetch<Paginated<Plan>>("/admin/plans", {
    query: { per_page: 100 },
  });

  return (
    <div>
      <PageHeader title="Plans d'abonnement" actions={<CreatePlan />} />

      {plans.length === 0 ? (
        <EmptyState>Aucun plan pour l&apos;instant.</EmptyState>
      ) : (
        <Table head={["Nom", "Prix", "Durée", "Résidences max.", "Statut", ""]}>
          {plans.map((plan) => (
            <Row key={plan.id}>
              <Cell>
                <div className="font-medium">{plan.name}</div>
                {plan.features.length > 0 && (
                  <div className="text-xs text-muted">{plan.features.join(" · ")}</div>
                )}
              </Cell>
              <Cell className="whitespace-nowrap tabular-nums">{formatPrice(plan.price)}</Cell>
              <Cell className="whitespace-nowrap">{plan.duration_days} jours</Cell>
              <Cell className="tabular-nums">{plan.max_residences}</Cell>
              <Cell>
                {plan.is_active ? (
                  <Badge tone={STATUS_TONES.done}>Actif</Badge>
                ) : (
                  <Badge tone={STATUS_TONES.idle}>Inactif</Badge>
                )}
              </Cell>
              <Cell>
                <PlanRowActions plan={plan} />
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}
