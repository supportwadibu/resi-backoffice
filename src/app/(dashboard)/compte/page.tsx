import { IdCard, KeyRound } from "lucide-react";
import type { Metadata } from "next";

import { DetailList, PageHeader, Section } from "@/components/page-header";
import { apiFetch } from "@/lib/api/client";
import type { UserDetail } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

import { PasswordAction, ProfileAction } from "./profile-actions";

export const metadata: Metadata = { title: "Mon compte" };

/** Compte de l'administrateur connecté : ses coordonnées et son mot de passe. */
export default async function ComptePage() {
  const { data: user } = await apiFetch<{ data: UserDetail }>("/admin/profile");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mon compte" description="Vos informations et vos identifiants de connexion au backoffice." />

      <Section title="Informations" icon={IdCard} actions={<ProfileAction user={user} />}>
        <DetailList
          items={[
            ["Nom", user.full_name],
            ["E-mail", user.email],
            ["Téléphone", user.phone],
            ["Dernière connexion", user.last_login_at ? formatDateTime(user.last_login_at) : "Jamais"],
          ]}
        />
      </Section>

      <Section title="Mot de passe" icon={KeyRound} actions={<PasswordAction />}>
        <DetailList items={[["Sessions ouvertes", user.active_sessions]]} />
        <p className="mt-3 text-sm text-muted">
          Changer le mot de passe ferme vos sessions ouvertes sur les autres appareils ; celle-ci reste ouverte.
        </p>
      </Section>
    </div>
  );
}
