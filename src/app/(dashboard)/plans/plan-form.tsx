"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { createPlan, deletePlan, updatePlan, type PlanInput } from "@/app/actions/plans";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
import { IconButton, RowActions } from "@/components/icon-button";
import { Input } from "@/components/input";
import { notify } from "@/components/toast";
import { number, text } from "@/lib/form-data";
import { expectOk } from "@/lib/action-result";
import type { Plan } from "@/lib/api/types";

function readForm(form: FormData): PlanInput | string {
  const price = number(form, "price");
  const durationDays = number(form, "duration_days");
  const maxResidences = number(form, "max_residences");
  if (price === null || price <= 0) return "Le prix doit être positif.";
  if (durationDays === null || !Number.isInteger(durationDays) || durationDays <= 0) {
    return "La durée doit être un nombre entier de jours.";
  }
  if (maxResidences === null || !Number.isInteger(maxResidences) || maxResidences <= 0) {
    return "Le nombre de résidences doit être un entier positif.";
  }

  return {
    name: text(form, "name"),
    description: text(form, "description"),
    price,
    duration_days: durationDays,
    max_residences: maxResidences,
    // Une fonctionnalité par ligne : plus simple à saisir qu'une liste éditable.
    features: text(form, "features")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    is_active: form.get("is_active") === "on",
  };
}

function PlanFields({ plan }: { plan?: Plan }) {
  return (
    <>
      <Input label="Nom" name="name" required minLength={5} maxLength={80} defaultValue={plan?.name} data-autofocus />
      <Input label="Description" type="description" name="description" rows={2} maxLength={1000} defaultValue={plan?.description} />
      <div className="grid grid-cols-3 gap-4">
        <Input label="Prix (F CFA)" type="number" name="price" required min={1} defaultValue={plan?.price} />
        <Input label="Durée (jours)" type="number" name="duration_days" required min={1} step={1} defaultValue={plan?.duration_days} />
        <Input label="Résidences max." type="number" name="max_residences" required min={1} step={1} defaultValue={plan?.max_residences} />
      </div>
      <Input
        label="Fonctionnalités"
        type="description"
        name="features"
        rows={4}
        hint="Une par ligne."
        defaultValue={plan?.features.join("\n")}
      />
      <Checkbox
        label="Proposé aux propriétaires"
        name="is_active"
        hint="Un plan inactif n'est plus proposé, les abonnements en cours continuent."
        defaultChecked={plan?.is_active ?? true}
      />
    </>
  );
}

export function CreatePlan() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-4" />
        Nouveau plan
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau plan"
        submitLabel="Créer"
        successTitle="Plan créé"
        onSubmit={async (form) => {
          const input = readForm(form);
          return typeof input === "string" ? input : createPlan(input);
        }}
      >
        <PlanFields />
      </FormDialog>
    </>
  );
}

export function PlanRowActions({ plan }: { plan: Plan }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <RowActions>
      <IconButton icon={Pencil} label={`Modifier ${plan.name}`} onClick={() => setEditing(true)} />
      <IconButton icon={Trash2} label={`Supprimer ${plan.name}`} tone="danger" onClick={() => setDeleting(true)} />

      <FormDialog
        open={editing}
        onClose={() => setEditing(false)}
        title={`Modifier ${plan.name}`}
        submitLabel="Enregistrer"
        successTitle="Plan modifié"
        onSubmit={async (form) => {
          const input = readForm(form);
          return typeof input === "string" ? input : updatePlan(plan.id, input);
        }}
      >
        <PlanFields plan={plan} />
      </FormDialog>

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        tone="danger"
        title={`Supprimer ${plan.name} ?`}
        description="Pour simplement ne plus le proposer, désactivez-le plutôt : la suppression est définitive."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          expectOk(await deletePlan(plan.id));
          notify.success("Plan supprimé");
        }}
      />
    </RowActions>
  );
}
