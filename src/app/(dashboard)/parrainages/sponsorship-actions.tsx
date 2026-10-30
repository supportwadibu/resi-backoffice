"use client";

import { Ban, Check, X } from "lucide-react";
import { useState } from "react";

import {
  cancelSponsorship,
  markRedemptionPaid,
  rejectRedemption,
} from "@/app/actions/sponsorships";
import { FormDialog } from "@/components/form-dialog";
import { IconButton } from "@/components/icon-button";
import { Input } from "@/components/input";
import { text } from "@/lib/form-data";
import { formatPrice } from "@/lib/format";

/** Annule le gain d'un filleul — faux compte, fraude constatée. */
export function CancelSponsorship({ id, earned }: { id: string; earned: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton icon={Ban} label="Annuler le gain" tone="danger" onClick={() => setOpen(true)} />
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Annuler ce parrainage ?"
        description={
          earned
            ? "Le gain, déjà disponible, est repris sur le solde du parrain — qui peut devenir négatif s'il l'a dépensé."
            : "Aucun gain ne sera attribué pour ce filleul."
        }
        submitLabel="Annuler le parrainage"
        tone="danger"
        successTitle="Parrainage annulé"
        onSubmit={(form) => cancelSponsorship(id, text(form, "reason"))}
      >
        <Input label="Motif" type="description" name="reason" required minLength={3} maxLength={500} rows={3} />
      </FormDialog>
    </>
  );
}

/** Marque un retrait de gains versé, une fois le transfert Wave effectué. */
export function MarkRedemptionPaid({
  id,
  amount,
  payoutPhone,
}: {
  id: string;
  amount: number;
  payoutPhone: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton icon={Check} label="Marquer versé" onClick={() => setOpen(true)} />
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Marquer ce retrait versé ?"
        description={`Confirmez avoir envoyé ${formatPrice(amount)} par Wave au ${payoutPhone}. Le geste est définitif.`}
        submitLabel="Marquer versé"
        successTitle="Retrait marqué versé"
        onSubmit={(form) => markRedemptionPaid(id, text(form, "payout_reference") || undefined)}
      >
        <Input label="Référence du transfert Wave (facultatif)" name="payout_reference" maxLength={120} />
      </FormDialog>
    </>
  );
}

/** Refuse un retrait de gains : le montant revient au parrain. */
export function RejectRedemption({ id }: { id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton icon={X} label="Refuser" tone="danger" onClick={() => setOpen(true)} />
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Refuser ce retrait ?"
        description="Le montant revient aux gains du parrain, qui voit le motif dans l'application."
        submitLabel="Refuser le retrait"
        tone="danger"
        successTitle="Retrait refusé"
        onSubmit={(form) => rejectRedemption(id, text(form, "rejection_reason"))}
      >
        <Input label="Motif" type="description" name="rejection_reason" required minLength={3} maxLength={500} rows={3} />
      </FormDialog>
    </>
  );
}
