"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createUser, type CreateUserInput } from "@/app/actions/users";
import { Button } from "@/components/button";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import type { RoleName } from "@/lib/api/types";
import { text } from "@/lib/form-data";
import { ROLE_LABELS, toOptions } from "@/lib/labels";

export interface OwnerOption {
  id: string;
  label: string;
}

/**
 * Création d'un compte, tous rôles. Le rôle choisi ajuste le formulaire :
 * l'e-mail devient obligatoire pour un admin, qui se connecte par e-mail, et
 * un gérant demande son propriétaire.
 *
 * Sur succès, la fiche du nouveau compte s'ouvre : c'est là qu'on le complète
 * ou qu'on vérifie ce qui a été enregistré.
 */
export function CreateUser({ owners }: { owners: OwnerOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<RoleName>("client");

  function close() {
    setOpen(false);
    setRole("client");
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus aria-hidden className="size-4" />
        Nouveau compte
      </Button>

      <FormDialog
        open={open}
        onClose={close}
        title="Nouveau compte"
        description="Le compte est vérifié d'office. Transmettez le mot de passe initial au titulaire : il pourra le changer depuis son profil."
        submitLabel="Créer le compte"
        successTitle="Compte créé"
        onSubmit={async (form) => {
          const input = readForm(form, role);
          if (typeof input === "string") return input;
          const result = await createUser(input);
          if (result.ok) router.push(`/comptes/${result.data.id}`);
          return result;
        }}
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Rôle"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as RoleName)}
            options={toOptions(ROLE_LABELS)}
            hint={ROLE_HINTS[role]}
          />
          <Input label="Nom complet" name="full_name" required minLength={2} maxLength={120} data-autofocus />
          <Input
            label="E-mail"
            type="email"
            name="email"
            required={role === "admin"}
            hint={role === "admin" ? "Identifiant de connexion au backoffice." : undefined}
          />
          <Input
            label="Téléphone"
            type="tel"
            name="phone"
            placeholder="+2250700000000"
            hint={role === "admin" ? undefined : "E-mail, téléphone ou les deux."}
          />
          {role === "gerant" && (
            <Select
              label="Propriétaire"
              name="owner_id"
              required
              placeholder="Choisir"
              defaultValue=""
              options={owners.map((owner) => ({ value: owner.id, label: owner.label }))}
              hint="Le propriétaire lui attribuera ensuite ses logements."
            />
          )}
          <Input
            label="Mot de passe initial"
            type="password"
            name="password"
            required
            minLength={8}
            maxLength={64}
            autoComplete="new-password"
            hint="8 caractères minimum."
          />
        </div>
      </FormDialog>
    </>
  );
}

const ROLE_HINTS: Record<RoleName, string> = {
  admin: "Accès complet au backoffice.",
  proprio: "Dossier à déposer puis à valider, comme après une inscription.",
  gerant: "Agit pour le compte d'un propriétaire, sur les logements qu'il lui confie.",
  client: "Réserve des logements depuis l'application.",
};

/** Validation locale des règles qui dépendent du rôle ; l'API les reprend. */
function readForm(form: FormData, role: RoleName): CreateUserInput | string {
  const email = text(form, "email");
  const phone = text(form, "phone");
  if (!email && !phone) return "Renseignez au moins un e-mail ou un numéro de téléphone.";
  if (role === "admin" && !email) return "Un administrateur se connecte par e-mail : l'adresse est obligatoire.";

  const ownerId = text(form, "owner_id");
  if (role === "gerant" && !ownerId) return "Choisissez le propriétaire pour lequel ce gérant travaille.";

  return {
    role,
    full_name: text(form, "full_name"),
    email: email || undefined,
    phone: phone || undefined,
    // Pas de `text()` : des espaces en tête ou en fin font partie du mot de passe.
    password: String(form.get("password") ?? ""),
    owner_id: role === "gerant" ? ownerId : undefined,
  };
}
