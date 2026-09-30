"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/button";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import type { ActionResult } from "@/lib/action-result";

const PERIOD_OPTIONS = [
  { value: "this_month", label: "Ce mois-ci" },
  { value: "last_month", label: "Le mois dernier" },
  { value: "this_year", label: "Cette année" },
  { value: "custom", label: "Période personnalisée" },
];

/**
 * Édition du registre de police d'un propriétaire.
 *
 * Le PDF transite par le route handler `rapport-police` : le navigateur ne
 * parle jamais à l'API. Le fichier est récupéré en `fetch` plutôt que par une
 * simple soumission de formulaire, pour qu'une erreur de l'API — résidence
 * introuvable, période trop large — s'affiche dans le dialogue au lieu de
 * remplacer la page.
 */
export function PoliceReportButton({
  ownerId,
  residences,
}: {
  ownerId: string;
  residences: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("this_month");

  async function download(form: FormData): Promise<ActionResult | string> {
    if (form.get("period") === "custom" && (!form.get("from") || !form.get("to"))) {
      return "Indiquez les deux bornes de la période.";
    }

    let response: Response;
    try {
      response = await fetch(`/proprietaires/${encodeURIComponent(ownerId)}/rapport-police`, {
        method: "POST",
        body: form,
      });
    } catch {
      return "Le serveur est injoignable. Réessayez dans un instant.";
    }

    // Session expirée : le handler a suivi la redirection vers la connexion.
    if (response.redirected && !response.headers.get("content-type")?.includes("pdf")) {
      window.location.href = response.url;
      return "Session expirée.";
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      return body?.message ?? "La génération du rapport a échoué.";
    }

    const disposition = response.headers.get("content-disposition");
    const filename = disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? "rapport-police.pdf";
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    return { ok: true, data: undefined, message: "Le PDF a été téléchargé." };
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <ShieldCheck aria-hidden className="size-4" />
        Rapport police
      </Button>

      <FormDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setPeriod("this_month");
        }}
        title="Rapport police"
        description="Liste des personnes hébergées, au format de la Brigade mondaine. Les séjours retenus chevauchent la période choisie."
        submitLabel="Télécharger le PDF"
        successTitle="Rapport police édité"
        onSubmit={download}
      >
        <Select
          label="Établissement"
          name="residence_id"
          hint="Sans résidence choisie, le registre porte le nom du propriétaire et la commune reste à remplir."
          options={[{ value: "", label: "Toutes les résidences" }, ...residences.map((r) => ({ value: r.id, label: r.name }))]}
          defaultValue=""
        />
        <Input
          label="Commune"
          name="commune"
          maxLength={80}
          hint="Imprimée en tête du registre. Vide : la ville de la résidence."
          placeholder="Ex : Cocody"
        />
        <Select
          label="Période"
          name="period"
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          data-autofocus
        />
        {period === "custom" && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Du" type="date" name="from" required />
            <Input label="Au" type="date" name="to" required />
          </div>
        )}
      </FormDialog>
    </>
  );
}
