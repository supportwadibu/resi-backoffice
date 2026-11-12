"use client";

import { ArchiveRestore, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteUser, purgeUser, restoreUser, updateUser, type UserPatch } from "@/app/actions/users";
import { Button, ButtonLink } from "@/components/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { notify } from "@/components/toast";
import { text } from "@/lib/form-data";
import { expectOk } from "@/lib/action-result";
import type { User } from "@/lib/api/types";

type Pending = "toggle" | "delete" | "restore" | "purge" | null;

export function UserActions({
  user,
  isSelf,
  purgeCount,
}: {
  user: User;
  isSelf: boolean;
  /** Documents qu'emporterait la suppression définitive ; compte supprimé seulement. */
  purgeCount?: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState<Pending>(null);
  const deleted = user.deleted_at !== null;

  async function toggleActive() {
    const result = expectOk(await updateUser(user.id, { is_active: !user.is_active }));
    notify.success(user.is_active ? "Compte désactivé" : "Compte réactivé", {
      description: result.message,
    });
  }

  async function softDelete() {
    expectOk(await deleteUser(user.id));
    notify.success("Compte supprimé", {
      description: "Il reste restaurable depuis cette fiche, ou le filtre « Supprimés ».",
    });
  }

  async function restore() {
    expectOk(await restoreUser(user.id));
    notify.success("Compte restauré");
  }

  async function purge() {
    const result = expectOk(await purgeUser(user.id));
    notify.success("Compte supprimé définitivement", { description: result.message });
    router.replace("/comptes");
  }

  // Un administrateur n'agit pas sur son propre compte : l'API le refuse, et
  // seul, il n'aurait plus personne pour lui rendre l'accès. Il le modifie
  // depuis « Mon compte », où le mot de passe actuel protège ses identifiants.
  if (isSelf) {
    return (
      <ButtonLink href="/compte">
        <Pencil aria-hidden className="size-4" />
        Modifier mon compte
      </ButtonLink>
    );
  }

  if (deleted) {
    return (
      <>
        <Button variant="secondary" onClick={() => setConfirming("restore")}>
          <ArchiveRestore aria-hidden className="size-4" />
          Restaurer
        </Button>
        <Button variant="danger" onClick={() => setConfirming("purge")}>
          <Trash2 aria-hidden className="size-4" />
          Supprimer définitivement
        </Button>

        <ConfirmDialog
          open={confirming === "restore"}
          onClose={() => setConfirming(null)}
          onConfirm={restore}
          title="Restaurer ce compte ?"
          description={
            user.deletion_requested_by_user
              ? `La suppression demandée par ${user.full_name} est annulée : le compte redevient utilisable et ne sera pas effacé.`
              : `${user.full_name} retrouve l'état qu'il avait avant la suppression : un compte désactivé par l'équipe le reste.`
          }
          confirmLabel="Restaurer"
        />
        <ConfirmDialog
          open={confirming === "purge"}
          onClose={() => setConfirming(null)}
          onConfirm={purge}
          tone="danger"
          title="Supprimer définitivement ce compte ?"
          description={
            <>
              Le compte de {user.full_name}
              {purgeCount ? `, ${purgeCount} document${purgeCount > 1 ? "s" : ""} rattaché${purgeCount > 1 ? "s" : ""}` : ""}{" "}
              et ses fichiers seront effacés, sans retour possible. Le détail figure sur la fiche.
            </>
          }
          confirmLabel="Supprimer définitivement"
        />
      </>
    );
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setEditing(true)}>
        <Pencil aria-hidden className="size-4" />
        Modifier
      </Button>
      <Button variant={user.is_active ? "danger" : "primary"} onClick={() => setConfirming("toggle")}>
        {user.is_active ? <UserX aria-hidden className="size-4" /> : <UserCheck aria-hidden className="size-4" />}
        {user.is_active ? "Désactiver" : "Réactiver"}
      </Button>
      <Button variant="danger" onClick={() => setConfirming("delete")}>
        <Trash2 aria-hidden className="size-4" />
        Supprimer
      </Button>

      {editDialog()}

      <ConfirmDialog
        open={confirming === "toggle"}
        onClose={() => setConfirming(null)}
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
      <ConfirmDialog
        open={confirming === "delete"}
        onClose={() => setConfirming(null)}
        onConfirm={softDelete}
        tone="danger"
        title="Supprimer ce compte ?"
        description={`${user.full_name} ne pourra plus se connecter et ses sessions seront fermées. Aucune donnée n'est effacée : le compte reste restaurable, ou supprimable définitivement ensuite.`}
        confirmLabel="Supprimer"
      />
    </>
  );

  function editDialog() {
    return (
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
    );
  }
}
