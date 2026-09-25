"use client";

import { Ban } from "lucide-react";
import { useState } from "react";

import { cancelSubscription } from "@/app/actions/subscriptions";
import { FormDialog } from "@/components/form-dialog";
import { IconButton } from "@/components/icon-button";
import { Input } from "@/components/input";
import { text } from "@/lib/form-data";

export function CancelSubscription({ id }: { id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton icon={Ban} label="Annuler l'abonnement" tone="danger" onClick={() => setOpen(true)} />
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Annuler cet abonnement ?"
        description="Le propriétaire perd immédiatement les avantages de son abonnement."
        submitLabel="Annuler l'abonnement"
        tone="danger"
        successTitle="Abonnement annulé"
        onSubmit={(form) => cancelSubscription(id, text(form, "reason") || undefined)}
      >
        <Input label="Motif (facultatif)" type="description" name="reason" maxLength={500} rows={3} />
      </FormDialog>
    </>
  );
}
