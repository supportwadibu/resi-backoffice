"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/button";
import { Dialog } from "@/components/dialog";
import { FormDialog } from "@/components/form-dialog";
import { Cell, Row, Table } from "@/components/table";
import type { ActionResult } from "@/lib/action-result";
import type { AccountImportReport } from "@/lib/api/types";
import { errorMessage, FILE_INPUT_CLASS, redirectedToLogin } from "@/lib/file-transfer";
import { formatNumber } from "@/lib/format";

const MATCH_LABELS = { id: "son identifiant", email: "son e-mail", phone: "son téléphone" } as const;

/**
 * Réimport d'un compte exporté depuis sa fiche.
 *
 * Le rapport s'ouvre dans un dialogue après l'import : section par section,
 * ce qui a été ajouté, ce qui était déjà là et ce qui a été écarté.
 */
export function AccountImportButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<AccountImportReport | null>(null);

  async function importAccount(form: FormData): Promise<ActionResult | string> {
    let response: Response;
    try {
      response = await fetch("/comptes/import", { method: "POST", body: form });
    } catch {
      return "Le serveur est injoignable. Réessayez dans un instant.";
    }

    if (redirectedToLogin(response)) return "Session expirée.";
    if (!response.ok) return errorMessage(response, "L'import a échoué.");

    const { data } = (await response.json()) as { data: AccountImportReport };
    setReport(data);
    router.refresh();

    return {
      ok: true,
      data: undefined,
      message: data.account.status === "created" ? "Compte recréé." : "Compte existant complété.",
    };
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Upload aria-hidden className="size-4" />
        Importer un compte
      </Button>

      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Importer un compte"
        description="Fichier produit par « Exporter » sur la fiche d'un compte. Un compte déjà présent (même identifiant, e-mail ou téléphone) est conservé : seules les données absentes lui sont ajoutées."
        submitLabel="Importer"
        successTitle="Import terminé"
        onSubmit={importAccount}
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Fichier d&apos;export (.json)</span>
          <input
            type="file"
            name="file"
            accept=".json,application/json"
            required
            data-autofocus
            className={FILE_INPUT_CLASS}
          />
        </label>
      </FormDialog>

      <Dialog
        open={report !== null}
        onClose={() => setReport(null)}
        title="Rapport d'import"
        description={
          report &&
          (report.account.status === "created"
            ? `${report.account.full_name ?? "Le compte"} a été recréé sous son identifiant d'origine.`
            : `${report.account.full_name ?? "Le compte"} existait déjà, retrouvé par ${MATCH_LABELS[report.account.matched_by ?? "id"]} : il est conservé tel quel et complété.`)
        }
        footer={
          report && (
            <>
              <Button variant="ghost" onClick={() => setReport(null)}>
                Fermer
              </Button>
              <ButtonLink
                variant="primary"
                href={`/comptes/${encodeURIComponent(report.account.id)}`}
                onClick={() => setReport(null)}
              >
                Voir le compte
              </ButtonLink>
            </>
          )
        }
      >
        {report && report.sections.length === 0 && (
          <p className="text-sm text-muted">Le fichier ne portait que le compte.</p>
        )}
        {report && report.sections.length > 0 && (
          <Table head={["Données", "Ajoutés", "Déjà présents", "Écartés"]}>
            {report.sections.map((section) => (
              <Row key={section.key}>
                <Cell>{section.label}</Cell>
                <Cell className="tabular-nums">{formatNumber(section.created)}</Cell>
                <Cell className="tabular-nums">{formatNumber(section.existing)}</Cell>
                <Cell className={`tabular-nums ${section.rejected > 0 ? "text-danger" : ""}`}>
                  {formatNumber(section.rejected)}
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Dialog>
    </>
  );
}
