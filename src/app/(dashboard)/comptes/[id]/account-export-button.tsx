"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { FormDialog } from "@/components/form-dialog";
import type { ActionResult } from "@/lib/action-result";
import type { AccountExportPreview } from "@/lib/api/types";
import { errorMessage, redirectedToLogin, saveResponse } from "@/lib/file-transfer";
import { formatNumber } from "@/lib/format";

type PreviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AccountExportPreview };

/**
 * Export d'un compte et des données choisies, en un fichier rejouable par
 * « Importer un compte ».
 *
 * Les volumes sont lus à l'ouverture : une section vide n'est pas proposée,
 * et les sections du rôle du compte sont cochées d'office.
 */
export function AccountExportButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ status: "loading" });
  const base = `/comptes/${encodeURIComponent(userId)}/export`;

  async function openDialog() {
    setOpen(true);
    setPreview({ status: "loading" });
    try {
      const response = await fetch(`${base}/apercu`);
      if (redirectedToLogin(response)) return;
      if (!response.ok) {
        setPreview({ status: "error", message: await errorMessage(response, "Aperçu indisponible.") });
        return;
      }
      const { data } = (await response.json()) as { data: AccountExportPreview };
      setPreview({ status: "ready", data });
    } catch {
      setPreview({ status: "error", message: "Le serveur est injoignable. Réessayez dans un instant." });
    }
  }

  async function download(form: FormData): Promise<ActionResult | string> {
    if (preview.status !== "ready") return "Attendez la fin du chargement des volumes.";

    const sections = form.getAll("sections").map(String);
    let response: Response;
    try {
      response = await fetch(`${base}?sections=${encodeURIComponent(sections.join(","))}`);
    } catch {
      return "Le serveur est injoignable. Réessayez dans un instant.";
    }

    if (redirectedToLogin(response)) return "Session expirée.";
    if (!response.ok) return errorMessage(response, "L'export a échoué.");

    const filename = await saveResponse(response, "compte-resi.json");
    return { ok: true, data: undefined, message: `Fichier ${filename} téléchargé.` };
  }

  return (
    <>
      <Button variant="secondary" onClick={openDialog}>
        <Download aria-hidden className="size-4" />
        Exporter
      </Button>

      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Exporter le compte"
        description="Le compte part toujours, mot de passe chiffré compris : le fichier donne accès au compte, gardez-le en lieu sûr. Choisissez les données qui l'accompagnent."
        submitLabel="Télécharger le fichier"
        successTitle="Compte exporté"
        onSubmit={download}
      >
        {preview.status === "loading" && <p className="text-sm text-muted">Comptage des données…</p>}
        {preview.status === "error" && <p className="text-sm text-danger">{preview.message}</p>}
        {preview.status === "ready" && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium">Données à inclure</legend>
            {preview.data.sections.map((section) => (
              <Checkbox
                key={section.key}
                name="sections"
                value={section.key}
                label={section.label}
                hint={
                  section.count === 0
                    ? "Rien à exporter"
                    : `${formatNumber(section.count)} document${section.count > 1 ? "s" : ""}`
                }
                defaultChecked={section.default_selected && section.count > 0}
                disabled={section.count === 0}
              />
            ))}
          </fieldset>
        )}
      </FormDialog>
    </>
  );
}
