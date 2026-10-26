"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";

import { updateWithdrawalSettings } from "@/app/actions/withdrawals";
import { Button } from "@/components/button";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { number } from "@/lib/form-data";
import { formatPrice } from "@/lib/format";

/** Bornes du validateur de l'API, reprises pour refuser avant l'envoi. */
const MIN = 100;
const MAX = 1_000_000;

/** Retrait minimal des propriétaires, réglé sans redéploiement. */
export function WithdrawalSettingsButton({ minimumAmount }: { minimumAmount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Settings2 aria-hidden className="size-4" />
        Minimum : {formatPrice(minimumAmount)}
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Retrait minimal"
        description="Montant en dessous duquel un propriétaire ne peut pas demander de retrait. Les demandes déjà envoyées ne changent pas."
        submitLabel="Enregistrer"
        successTitle="Retrait minimal enregistré"
        onSubmit={async (form) => {
          const value = number(form, "minimum_amount");
          if (value === null || !Number.isInteger(value) || value < MIN || value > MAX) {
            return `Indiquez un montant entier entre ${formatPrice(MIN)} et ${formatPrice(MAX)}.`;
          }
          return updateWithdrawalSettings(value);
        }}
      >
        <Input
          label="Montant minimal (F)"
          type="number"
          name="minimum_amount"
          defaultValue={minimumAmount}
          min={MIN}
          max={MAX}
          step={1}
          required
          data-autofocus
        />
      </FormDialog>
    </>
  );
}
