"use client";

import { KeyRound, Pencil } from "lucide-react";
import { useState } from "react";

import { updateProfile, type ProfilePatch } from "@/app/actions/profile";
import { Button } from "@/components/button";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { text } from "@/lib/form-data";
import type { User } from "@/lib/api/types";

/** Longueur minimale d'un mot de passe, comme le validateur de l'API. */
const MIN_PASSWORD = 8;

export function ProfileAction({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Pencil aria-hidden className="size-4" />
        Modifier
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Modifier mes informations"
        description="L'e-mail est votre identifiant de connexion au backoffice : il ne peut pas être effacé."
        submitLabel="Enregistrer"
        successTitle="Informations enregistrées"
        onSubmit={async (form) => {
          const patch: ProfilePatch = {};
          const fullName = text(form, "full_name");
          const email = text(form, "email");
          const phone = text(form, "phone");
          const current = String(form.get("current_password") ?? "");
          // N'envoie que ce qui change : un identifiant renvoyé à l'identique
          // exigerait le mot de passe pour rien.
          if (fullName !== user.full_name) patch.full_name = fullName;
          if (email && email !== user.email) patch.email = email;
          if (phone !== (user.phone ?? "")) patch.phone = phone || null;
          if (Object.keys(patch).length === 0) return "Aucune modification à enregistrer.";
          if ((patch.email !== undefined || patch.phone !== undefined) && !current) {
            return "Saisissez votre mot de passe actuel pour changer l'e-mail ou le téléphone.";
          }
          if (current) patch.current_password = current;
          return updateProfile(patch);
        }}
      >
        <Input label="Nom complet" name="full_name" defaultValue={user.full_name} required minLength={2} maxLength={120} data-autofocus />
        <Input label="E-mail" type="email" name="email" defaultValue={user.email ?? ""} required autoComplete="email" />
        <Input label="Téléphone" type="tel" name="phone" defaultValue={user.phone ?? ""} hint="Facultatif. Laisser vide pour le retirer." />
        <Input
          label="Mot de passe actuel"
          type="password"
          name="current_password"
          autoComplete="current-password"
          hint="Requis pour changer l'e-mail ou le téléphone."
        />
      </FormDialog>
    </>
  );
}

export function PasswordAction() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <KeyRound aria-hidden className="size-4" />
        Changer le mot de passe
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Changer le mot de passe"
        submitLabel="Changer le mot de passe"
        successTitle="Mot de passe changé"
        onSubmit={async (form) => {
          const current = String(form.get("current_password") ?? "");
          const next = String(form.get("new_password") ?? "");
          const confirmation = String(form.get("new_password_confirmation") ?? "");
          if (next.length < MIN_PASSWORD) {
            return `Le nouveau mot de passe doit compter au moins ${MIN_PASSWORD} caractères.`;
          }
          if (next !== confirmation) return "Les deux mots de passe ne correspondent pas.";
          if (next === current) return "Le nouveau mot de passe doit différer de l'actuel.";
          return updateProfile({ current_password: current, new_password: next });
        }}
      >
        <Input label="Mot de passe actuel" type="password" name="current_password" required autoComplete="current-password" data-autofocus />
        <Input
          label="Nouveau mot de passe"
          type="password"
          name="new_password"
          required
          minLength={MIN_PASSWORD}
          maxLength={64}
          autoComplete="new-password"
          hint={`${MIN_PASSWORD} caractères minimum.`}
        />
        <Input label="Confirmer le nouveau mot de passe" type="password" name="new_password_confirmation" required autoComplete="new-password" />
      </FormDialog>
    </>
  );
}
