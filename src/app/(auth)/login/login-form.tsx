"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";

import { login } from "@/app/actions/auth";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { notify } from "@/components/toast";

export function LoginForm({
  next,
  expired = false,
}: {
  next?: string;
  expired?: boolean;
}) {
  const [state, action, pending] = useActionState(login, undefined);
  const [navigating, startNavigation] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!expired) return;
    notify.warning("Session expirée", {
      description: "Reconnectez-vous pour continuer.",
      id: "session-expired",
    });
  }, [expired]);

  // Chaque soumission rend un nouvel objet : l'effet se rejoue même quand la
  // même erreur revient deux fois de suite.
  useEffect(() => {
    if (!state) return;

    if (state.status === "success") {
      notify.success(state.title);
      // Le Toaster vit dans le layout racine : le toast survit à la
      // navigation et s'affiche encore sur le tableau de bord.
      startNavigation(() => router.replace(state.redirectTo));
      return;
    }

    notify[state.status](state.title, { description: state.description });
  }, [state, router]);

  // Le bouton reste bloqué jusqu'à l'arrivée sur la page suivante : entre la
  // réponse de l'action et la navigation, un second clic relancerait une
  // connexion déjà réussie.
  const busy = pending || navigating || state?.status === "success";

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}

      <Input
        label="E-mail ou téléphone"
        name="identifier"
        type="text"
        autoComplete="username"
        required
      />

      <Input
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <Button type="submit" disabled={busy} className="mt-2">
        {busy ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
