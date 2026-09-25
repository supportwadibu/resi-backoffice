"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  createPromoCode,
  deletePromoCode,
  updatePromoCode,
  type PromoCodeInput,
} from "@/app/actions/promo-codes";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
import { IconButton, RowActions } from "@/components/icon-button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { notify } from "@/components/toast";
import { number, text } from "@/lib/form-data";
import { expectOk } from "@/lib/action-result";
import type { PromoCode, PromoCodeType } from "@/lib/api/types";
import { PROMO_TYPE_LABELS, toOptions } from "@/lib/labels";

/**
 * Les bornes se saisissent au jour et s'envoient en horodatage UTC — le fuseau
 * d'Abidjan : le début à la première seconde du jour, la fin à la dernière,
 * pour qu'un code « valable jusqu'au 30 » serve encore le 30 au soir.
 */
function toStart(day: string): string | null {
  return day ? `${day}T00:00:00.000Z` : null;
}

function toEnd(day: string): string | null {
  return day ? `${day}T23:59:59.999Z` : null;
}

function toDay(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function readForm(form: FormData): PromoCodeInput | string {
  const value = number(form, "value");
  if (value === null || value <= 0) return "La valeur doit être un nombre positif.";
  const type = text(form, "type") as PromoCodeType;
  if (type === "percentage" && value > 100) return "Un pourcentage ne peut pas dépasser 100.";

  const startsAt = toStart(text(form, "starts_at"));
  const expiresAt = toEnd(text(form, "expires_at"));
  if (startsAt && expiresAt && expiresAt < startsAt) {
    return "La date de fin précède la date de début.";
  }

  return {
    type,
    value,
    min_amount: number(form, "min_amount"),
    max_uses: number(form, "max_uses"),
    max_uses_per_user: number(form, "max_uses_per_user") ?? 1,
    starts_at: startsAt,
    expires_at: expiresAt,
    is_active: form.get("is_active") === "on",
  };
}

function PromoCodeFields({ code }: { code?: PromoCode }) {
  return (
    <>
      {!code && (
        <Input
          label="Code"
          name="code"
          required
          minLength={3}
          maxLength={32}
          pattern="[A-Za-z0-9_\-]+"
          hint="Lettres, chiffres, tiret et tiret bas. Ne pourra plus être modifié."
          data-autofocus
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type"
          name="type"
          defaultValue={code?.type ?? "percentage"}
          options={toOptions(PROMO_TYPE_LABELS)}
        />
        <Input
          label="Valeur"
          type="number"
          name="value"
          required
          min={0}
          step="any"
          defaultValue={code?.value}
          hint="En % ou en F CFA selon le type"
          data-autofocus={code ? true : undefined}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Montant minimum"
          type="number"
          name="min_amount"
          min={0}
          defaultValue={code?.min_amount ?? ""}
          hint="Vide : aucun"
        />
        <Input
          label="Utilisations max."
          type="number"
          name="max_uses"
          min={1}
          step={1}
          defaultValue={code?.max_uses ?? ""}
          hint="Vide : illimité"
        />
      </div>
      <Input
        label="Utilisations max. par client"
        type="number"
        name="max_uses_per_user"
        min={1}
        step={1}
        required
        defaultValue={code?.max_uses_per_user ?? 1}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Valable du" type="date" name="starts_at" defaultValue={toDay(code?.starts_at ?? null)} />
        <Input label="Jusqu'au" type="date" name="expires_at" defaultValue={toDay(code?.expires_at ?? null)} />
      </div>
      <Checkbox label="Actif" name="is_active" defaultChecked={code?.is_active ?? true} />
    </>
  );
}

export function CreatePromoCode() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-4" />
        Nouveau code
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau code promo"
        submitLabel="Créer"
        successTitle="Code promo créé"
        onSubmit={async (form) => {
          const input = readForm(form);
          if (typeof input === "string") return input;
          return createPromoCode({ ...input, code: text(form, "code") });
        }}
      >
        <PromoCodeFields />
      </FormDialog>
    </>
  );
}

export function PromoCodeRowActions({ code }: { code: PromoCode }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <RowActions>
      <IconButton icon={Pencil} label={`Modifier ${code.code}`} onClick={() => setEditing(true)} />
      {/* Un code déjà utilisé reste référencé par des réservations : l'API
          en refuse la suppression, il se désactive. */}
      {code.uses_count === 0 && (
        <IconButton icon={Trash2} label={`Supprimer ${code.code}`} tone="danger" onClick={() => setDeleting(true)} />
      )}

      <FormDialog
        open={editing}
        onClose={() => setEditing(false)}
        title={`Modifier ${code.code}`}
        submitLabel="Enregistrer"
        successTitle="Code promo modifié"
        onSubmit={async (form) => {
          const input = readForm(form);
          return typeof input === "string" ? input : updatePromoCode(code.id, input);
        }}
      >
        <PromoCodeFields code={code} />
      </FormDialog>

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        tone="danger"
        title={`Supprimer ${code.code} ?`}
        description="Le code n'a jamais servi : sa suppression est définitive."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          expectOk(await deletePromoCode(code.id));
          notify.success("Code promo supprimé");
        }}
      />
    </RowActions>
  );
}
