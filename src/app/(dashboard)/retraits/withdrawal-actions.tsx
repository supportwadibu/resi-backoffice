"use client";

import { Check, Send, X } from "lucide-react";
import { useState } from "react";

import { markWithdrawalPaid, payWithdrawalWithWave, rejectWithdrawal } from "@/app/actions/withdrawals";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
import { IconButton } from "@/components/icon-button";
import { Input } from "@/components/input";
import { notify } from "@/components/toast";
import { expectOk } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import { formatPrice } from "@/lib/format";

/**
 * Verse la demande par l'API Payout de Wave. L'issue peut être un succès, un
 * refus de Wave (la demande reste à verser, motif affiché) ou un versement
 * encore en traitement.
 */
export function PayWithdrawalWithWave({
  id,
  netAmount,
  payoutPhone,
}: {
  id: string;
  netAmount: number;
  payoutPhone: string;
}) {
  const [open, setOpen] = useState(false);

  async function pay() {
    const { data } = expectOk(await payWithdrawalWithWave(id));
    if (data.status === "paid") {
      notify.success("Retrait versé par Wave", { description: `Référence ${data.payout_reference}` });
    } else if (data.status === "processing") {
      notify.info("Versement en cours chez Wave", {
        description: "Son issue sera relue automatiquement dans quelques minutes.",
      });
    } else {
      notify.error("Wave a refusé le versement", { description: data.payout_error?.message });
    }
  }

  return (
    <>
      <IconButton icon={Send} label="Verser par Wave" onClick={() => setOpen(true)} />
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={pay}
        title="Verser ce retrait par Wave ?"
        description={`${formatPrice(netAmount)} partent du compte Wave Business de RESI vers le ${payoutPhone}. L'envoi est immédiat.`}
        confirmLabel="Verser par Wave"
      />
    </>
  );
}

/** Marque une demande versée, une fois le transfert Wave effectué à la main. */
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
        onSubmit={(form) => markWithdrawalPaid(id, text(form, "payout_reference"))}
      >
        <Input
          label="Référence du transfert Wave"
          name="payout_reference"
          hint="Identifiant de la transaction dans Wave Business, après l'envoi."
          required
          minLength={6}
          maxLength={120}
        />
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
