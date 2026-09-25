"use client";

import { Pencil, UserCheck, UserX } from "lucide-react";
import { useState } from "react";

import { updateUser, type UserPatch } from "@/app/actions/users";
import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { notify } from "@/components/toast";
import { text } from "@/lib/form-data";
import { expectOk } from "@/lib/action-result";
import type { User } from "@/lib/api/types";

export function UserActions({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function toggleActive() {
    const result = expectOk(await updateUser(user.id, { is_active: !user.is_active }));
    notify.success(user.is_active ? "Compte désactivé" : "Compte réactivé", {
      description: result.message,
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setEditing(true)}>
        <Pencil aria-hidden className="size-4" />
        Modifier
      </Button>
      {/* Un administrateur ne peut pas se désactiver : l'API le refuse, et
          seul, il n'aurait plus personne pour lui rendre l'accès. */}
      {!isSelf && (
        <Button variant={user.is_active ? "danger" : "primary"} onClick={() => setToggling(true)}>
          {user.is_active ? (
            <UserX aria-hidden className="size-4" />
          ) : (
            <UserCheck aria-hidden className="size-4" />
          )}
          {user.is_active ? "Désactiver" : "Réactiver"}
        </Button>
      )}

      <FormDialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Modifier le compte"
        description="L'e-mail et le téléphone servent d'identifiants de connexion : ils ne peuvent pas être effacés."
        submitLabel="Enregistrer"
        successTitle="Compte modifié"
        onSubmit={async (form) => {
          const patch: UserPatch = {};
          const fullName = text(form, "full_name");
          const email = text(form, "email");
          const phone = text(form, "phone");
          // N'envoie que ce qui change : réécrire un e-mail identique
          // relancerait inutilement le contrôle d'unicité.
          if (fullName !== user.full_name) patch.full_name = fullName;
          if (email && email !== user.email) patch.email = email;
          if (phone && phone !== user.phone) patch.phone = phone;
          if (Object.keys(patch).length === 0) return "Aucune modification à enregistrer.";
          return updateUser(user.id, patch);
        }}
      >
        <Input label="Nom complet" name="full_name" defaultValue={user.full_name} required minLength={2} maxLength={120} data-autofocus />
        <Input label="E-mail" type="email" name="email" defaultValue={user.email ?? ""} />
        <Input label="Téléphone" type="tel" name="phone" defaultValue={user.phone ?? ""} />
      </FormDialog>

      <ConfirmDialog
        open={toggling}
        onClose={() => setToggling(false)}
        onConfirm={toggleActive}
        tone={user.is_active ? "danger" : "default"}
        title={user.is_active ? "Désactiver ce compte ?" : "Réactiver ce compte ?"}
        description={
          user.is_active
            ? `${user.full_name} ne pourra plus se connecter, et ses sessions ouvertes seront fermées.`
            : `${user.full_name} pourra de nouveau se connecter.`
        }
        confirmLabel={user.is_active ? "Désactiver" : "Réactiver"}
      />
    </>
  );
}
