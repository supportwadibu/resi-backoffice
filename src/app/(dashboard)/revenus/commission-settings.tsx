"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";

import { updateCommissionSettings } from "@/app/actions/commissions";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import type { CommissionMode, CommissionSettings } from "@/lib/api/types";
import { number, text } from "@/lib/form-data";
import { COMMISSION_MODE_LABELS, toOptions } from "@/lib/labels";

/** Lit le formulaire ; une chaîne est un message d'erreur à afficher. */
function readSettings(form: FormData): Omit<CommissionSettings, "updated_at"> | string {
  const enabled = form.get("enabled") === "on";
  const mode = text(form, "mode") as CommissionMode;
  const value = number(form, "value");
  if (value === null || value < 0) return "La commission est un nombre positif.";
  if (mode === "percent" && value > 100) return "Un pourcentage se règle entre 0 et 100.";
  if (enabled && value === 0) return "Indiquez une commission positive pour l'activer.";
  return { enabled, mode, value };
}

/** Commission de RESI sur les réservations en ligne, sans redéploiement. */
export function CommissionSettingsButton({ settings }: { settings: CommissionSettings }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Settings2 aria-hidden className="size-4" />
        Commission
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Commission RESI"
        description="Ajoutée au prix par nuit du propriétaire dans l'application client, paliers de négociation compris. Vaut aussitôt pour les prix affichés ; une réservation déjà prise garde sa règle."
        submitLabel="Enregistrer"
        successTitle="Commission enregistrée"
        onSubmit={async (form) => {
          const input = readSettings(form);
          return typeof input === "string" ? input : updateCommissionSettings(input);
        }}
      >
        <div className="space-y-4">
          <Checkbox
            label="Commission activée"
            name="enabled"
            defaultChecked={settings.enabled}
            hint="Coupée, le client paie le prix du propriétaire."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Type"
              name="mode"
              defaultValue={settings.mode}
              options={toOptions(COMMISSION_MODE_LABELS)}
            />
            <Input
              label="Valeur (% ou F par nuit)"
              type="number"
              name="value"
              defaultValue={settings.value}
              min={0}
              step="any"
              required
            />
          </div>
        </div>
      </FormDialog>
    </>
  );
}
