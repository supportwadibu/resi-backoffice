"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import { markWithdrawalPaid, rejectWithdrawal } from "@/app/actions/withdrawals";
import { FormDialog } from "@/components/form-dialog";
import { IconButton } from "@/components/icon-button";
import { Input } from "@/components/input";
import { text } from "@/lib/form-data";
import { formatPrice } from "@/lib/format";

/** Marque une demande versée, une fois le transfert Wave effectué. */
export function MarkWithdrawalPaid({
  id,
  netAmount,
  payoutPhone,
}: {
  id: string;
  netAmount: number;
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
        description={`Confirmez avoir envoyé ${formatPrice(netAmount)} par Wave au ${payoutPhone}. Le geste est définitif.`}
        submitLabel="Marquer versé"
        successTitle="Retrait marqué versé"
        onSubmit={(form) => markWithdrawalPaid(id, text(form, "payout_reference") || undefined)}
      >
        <Input label="Référence du transfert Wave (facultatif)" name="payout_reference" maxLength={120} />
      </FormDialog>
    </>
  );
}

/** Refuse une demande : le montant revient au portefeuille. */
export function RejectWithdrawal({ id }: { id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton icon={X} label="Refuser" tone="danger" onClick={() => setOpen(true)} />
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Refuser ce retrait ?"
        description="Le montant revient au portefeuille du propriétaire, qui voit le motif dans l'application."
        submitLabel="Refuser le retrait"
        tone="danger"
        successTitle="Retrait refusé"
        onSubmit={(form) => rejectWithdrawal(id, text(form, "rejection_reason"))}
      >
        <Input label="Motif" type="description" name="rejection_reason" required minLength={3} maxLength={500} rows={3} />
      </FormDialog>
    </>
  );
}
