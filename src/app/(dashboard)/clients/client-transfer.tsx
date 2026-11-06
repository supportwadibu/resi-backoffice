"use client";

import { CircleAlert, CircleCheck, Download, FileText, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/button";
import { FormDialog } from "@/components/form-dialog";
import { PageHeader, Section } from "@/components/page-header";
import { SECTION_ICONS } from "@/components/shell/navigation";
import { StatTile } from "@/components/stat-tile";
import { Cell, PersonCell, Row, Table } from "@/components/table";
import { notify } from "@/components/toast";
import type { ActionResult } from "@/lib/action-result";
import type { ClientImportReport } from "@/lib/api/types";
import { errorMessage, FILE_INPUT_CLASS, redirectedToLogin, saveResponse } from "@/lib/file-transfer";

/**
 * Export et réimport du carnet clients de toute la plateforme, pour vider la
 * base sans perdre les fiches.
 *
 * Les fichiers transitent par les route handlers `export` et `import` : le
 * navigateur ne parle jamais à l'API. Un `fetch` plutôt qu'un lien ou une
 * soumission de formulaire, pour qu'une erreur s'affiche au lieu de
 * remplacer la page.
 */
export function ClientTransfer() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState<ClientImportReport | null>(null);

  async function exportClients() {
    setExporting(true);
    try {
      const response = await fetch("/clients/export");
      if (redirectedToLogin(response)) return;
      if (!response.ok) {
        notify.error("Export impossible", { description: await errorMessage(response, "L'export a échoué.") });
        return;
      }

      const filename = await saveResponse(response, "clients-resi.json");
      notify.success("Clients exportés", { description: `Fichier ${filename} téléchargé.` });
    } catch {
      notify.error("Export impossible", { description: "Le serveur est injoignable. Réessayez dans un instant." });
    } finally {
      setExporting(false);
    }
  }

  async function importClients(form: FormData): Promise<ActionResult | string> {
    let response: Response;
    try {
      response = await fetch("/clients/import", { method: "POST", body: form });
    } catch {
      return "Le serveur est injoignable. Réessayez dans un instant.";
    }

    if (redirectedToLogin(response)) return "Session expirée.";
    if (!response.ok) return errorMessage(response, "L'import a échoué.");

    const { data } = (await response.json()) as { data: ClientImportReport };
    setReport(data);

    const skipped = data.skipped.length;
    return {
      ok: true,
      data: undefined,
      message:
        `${data.created} fiche${data.created > 1 ? "s" : ""} importée${data.created > 1 ? "s" : ""}` +
        (skipped > 0 ? `, ${skipped} ignorée${skipped > 1 ? "s" : ""} — détail sur la page.` : "."),
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Carnets clients de tous les propriétaires, à sauvegarder avant une remise à zéro de la base."
        actions={
          <>
            <Button variant="secondary" onClick={exportClients} disabled={exporting}>
              <Download aria-hidden className="size-4" />
              {exporting ? "Export…" : "Exporter"}
            </Button>
            <Button onClick={() => setImporting(true)}>
              <Upload aria-hidden className="size-4" />
              Importer
            </Button>
          </>
        }
      />

      <Section title="Fonctionnement" icon={FileText}>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>
            L&apos;export produit un fichier JSON avec chaque fiche et l&apos;identité de son
            propriétaire (e-mail, téléphone). Il contient des numéros de pièce : gardez-le en lieu sûr.
          </li>
          <li>
            À l&apos;import, chaque fiche rejoint le compte propriétaire qui porte le même identifiant,
            le même e-mail ou le même téléphone. Recréez les propriétaires avant d&apos;importer.
          </li>
          <li>
            Les statistiques de séjour repartent de zéro : elles se recalculent sur les nouvelles
            réservations. Les photos des pièces, conservées chez Cloudinary, sont retrouvées.
          </li>
          <li>
            L&apos;import peut être relancé sans créer de doublon : une fiche déjà présente, ou un
            numéro déjà connu du carnet, est ignoré.
          </li>
        </ul>
      </Section>

      {report && <ImportReport report={report} />}

      <FormDialog
        open={importing}
        onClose={() => setImporting(false)}
        title="Importer des clients"
        description="Fichier produit par « Exporter ». Les fiches sans propriétaire retrouvé sont ignorées et listées."
        submitLabel="Importer"
        successTitle="Import terminé"
        onSubmit={importClients}
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
    </div>
  );
}

function ImportReport({ report }: { report: ClientImportReport }) {
  return (
    <Section title="Dernier import" icon={SECTION_ICONS.clients}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Fiches lues" value={String(report.total)} icon={FileText} />
        <StatTile label="Importées" value={String(report.created)} icon={CircleCheck} accent="green" />
        <StatTile
          label="Ignorées"
          value={String(report.skipped.length)}
          icon={CircleAlert}
          accent={report.skipped.length > 0 ? "amber" : "neutral"}
        />
      </div>

      {report.skipped.length > 0 && (
        <div className="mt-4">
          <Table head={["Ligne", "Client", "Motif"]}>
            {report.skipped.map((entry) => (
              <Row key={`${entry.line}-${entry.id}`}>
                <Cell className="tabular-nums">{entry.line}</Cell>
                <Cell>
                  <PersonCell name={entry.full_name} contact={entry.phone} />
                </Cell>
                <Cell className="text-sm">{entry.message}</Cell>
              </Row>
            ))}
          </Table>
        </div>
      )}
    </Section>
  );
}
