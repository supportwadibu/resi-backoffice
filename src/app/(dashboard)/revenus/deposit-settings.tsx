"use client";

import { Wallet } from "lucide-react";
import { useState } from "react";

import { updateDepositSettings } from "@/app/actions/commissions";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import type { DepositSettings, DepositType } from "@/lib/api/types";
import { number, text } from "@/lib/form-data";
import { DEPOSIT_TYPE_LABELS, toOptions } from "@/lib/labels";

/** Lit le formulaire ; une chaîne est un message d'erreur à afficher. */
function readSettings(form: FormData): Omit<DepositSettings, "updated_at"> | string {
  const enabled = form.get("enabled") === "on";
  const ownerCanSet = form.get("owner_can_set") === "on";
  const type = text(form, "type") as DepositType;
  const value = number(form, "value");
  if (value === null || value <= 0) return "L'acompte est un nombre supérieur à zéro.";
  // 100 % reviendrait au paiement total : l'API le refuse aussi.
  if (type === "percent" && value > 99) return "Un pourcentage se règle entre 1 et 99.";
  if (type === "fixed" && !Number.isInteger(value)) {
    return "Un montant fixe s'exprime en francs entiers.";
  }
  return { enabled, owner_can_set: ownerCanSet, type, value };
}

/** Acompte proposé au client à la réservation en ligne, sans redéploiement. */
export function DepositSettingsButton({ settings }: { settings: DepositSettings }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Wallet aria-hidden className="size-4" />
        Acompte
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Acompte"
        description="Le client verse l'acompte par Wave et règle le reste au comptoir avant la remise des clés. Il ne descend jamais sous la commission de RESI, retenue dessus en entier. Une réservation déjà prise garde son acompte."
        submitLabel="Enregistrer"
        successTitle="Acompte enregistré"
        onSubmit={async (form) => {
          const input = readSettings(form);
          return typeof input === "string" ? input : updateDepositSettings(input);
        }}
      >
        <div className="space-y-4">
          <Checkbox
            label="Acompte proposé"
            name="enabled"
            defaultChecked={settings.enabled}
            hint="Coupé, le client paie toujours la totalité en ligne."
          />
          <Checkbox
            label="Le propriétaire règle son acompte"
            name="owner_can_set"
            defaultChecked={settings.owner_can_set}
            hint="Chaque logement porte alors son propre acompte, ou le refuse. La règle ci-dessous sert aux logements jamais réglés."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Type"
              name="type"
              defaultValue={settings.type}
              options={toOptions(DEPOSIT_TYPE_LABELS)}
            />
            <Input
              label="Valeur (% ou F)"
              type="number"
              name="value"
              defaultValue={settings.value}
              min={1}
              step="any"
              required
            />
          </div>
        </div>
      </FormDialog>
    </>
  );
}
