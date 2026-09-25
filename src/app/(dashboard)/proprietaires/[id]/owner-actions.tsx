"use client";

import { CircleCheck, CircleX, Pencil } from "lucide-react";
import { useState } from "react";

import { rejectOwner, validateOwner } from "@/app/actions/owners";
import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { notify } from "@/components/toast";
import { text } from "@/lib/form-data";
import { expectOk } from "@/lib/action-result";
import type { Owner } from "@/lib/api/types";

/**
 * Décisions sur un dossier. Seules les transitions que l'API accepte sont
 * proposées : un compte validé ne se rejette pas, un compte rejeté ne se
 * valide pas sans réactivation manuelle, un compte dont l'OTP n'est pas
 * vérifié ne se valide pas. Rejeter de nouveau un compte rejeté en remplace
 * le motif.
 */
export function OwnerActions({ owner }: { owner: Owner }) {
  const [validating, setValidating] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const canValidate =
    owner.is_verified && (owner.owner_status === "pending" || owner.owner_status === "suspended");
  const canReject = owner.owner_status !== "active";

  if (!canValidate && !canReject) return null;

  return (
    <>
      {canReject && (
        <Button variant="secondary" onClick={() => setRejecting(true)}>
          {owner.owner_status === "rejected" ? (
            <>
              <Pencil aria-hidden className="size-4" />
              Modifier le motif
            </>
          ) : (
            <>
              <CircleX aria-hidden className="size-4" />
              Rejeter
            </>
          )}
        </Button>
      )}
      {canValidate && (
        <Button onClick={() => setValidating(true)}>
          <CircleCheck aria-hidden className="size-4" />
          Valider
        </Button>
      )}

      <ConfirmDialog
        open={validating}
        onClose={() => setValidating(false)}
        title="Valider ce propriétaire ?"
        description={
          owner.profile_submitted
            ? `${owner.full_name} pourra publier ses logements. Un essai gratuit s'ouvre s'il n'en a pas déjà un.`
            : `${owner.full_name} n'a pas encore déposé son dossier. Le valider quand même lui ouvre la publication de ses logements.`
        }
        confirmLabel="Valider"
        onConfirm={async () => {
          const result = expectOk(await validateOwner(owner.id));
          notify.success("Propriétaire validé", { description: result.message });
        }}
      />

      <FormDialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Rejeter ce dossier ?"
        description="Le motif est communiqué au propriétaire : rédigez-le pour qu'il sache quoi corriger."
        submitLabel="Rejeter"
        tone="danger"
        successTitle="Propriétaire rejeté"
        onSubmit={(form) => rejectOwner(owner.id, text(form, "reason"))}
      >
        <Input
          label="Motif du rejet"
          type="description"
          name="reason"
          required
          minLength={3}
          maxLength={500}
          data-autofocus
        />
      </FormDialog>
    </>
  );
}
