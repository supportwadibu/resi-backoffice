"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";

import { extendSubscription } from "@/app/actions/subscriptions";
import { FormDialog } from "@/components/form-dialog";
import { IconButton } from "@/components/icon-button";
import { Input } from "@/components/input";
import { number, text } from "@/lib/form-data";
import { formatDate } from "@/lib/format";

/** Borne de l'API : au-delà, c'est un abonnement à souscrire. */
const MAX_DAYS = 365;

export function ExtendSubscription({ id, endDate }: { id: string; endDate: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton icon={CalendarPlus} label="Prolonger l'abonnement" onClick={() => setOpen(true)} />
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Prolonger cet abonnement"
        description={`Échéance actuelle : ${formatDate(endDate)}. Les jours s'ajoutent à cette date, sans paiement.`}
        submitLabel="Prolonger"
        successTitle="Abonnement prolongé"
        onSubmit={async (form) => {
          const days = number(form, "days");
          if (days === null || !Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
            return `La prolongation doit être comprise entre 1 et ${MAX_DAYS} jours.`;
          }
          return extendSubscription(id, days, text(form, "reason") || undefined);
        }}
      >
        <Input
          label="Nombre de jours"
          type="number"
          name="days"
          required
          min={1}
          max={MAX_DAYS}
          step={1}
          defaultValue={30}
          data-autofocus
        />
        <Input
          label="Motif (facultatif)"
          type="description"
          name="reason"
          minLength={3}
          maxLength={500}
          rows={3}
          hint="Conservé dans l'historique de l'abonnement."
        />
      </FormDialog>
    </>
  );
}
