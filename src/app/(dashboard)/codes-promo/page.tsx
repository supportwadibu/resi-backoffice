import type { Metadata } from "next";

import { Badge } from "@/components/badge";
import { EmptyState, PageHeader } from "@/components/page-header";
import { STATUS_TONES } from "@/components/status-badges";
import { Cell, Row, Table } from "@/components/table";
import { apiFetch } from "@/lib/api/client";
import type { PromoCode } from "@/lib/api/types";
import { formatNumber, formatOptionalDate, formatPrice } from "@/lib/format";

import { CreatePromoCode, PromoCodeRowActions } from "./promo-code-form";

export const metadata: Metadata = { title: "Codes promo" };

export default async function CodesPromoPage() {
  // Liste complète, non paginée côté API.
  const { data: codes } = await apiFetch<{ data: PromoCode[] }>("/admin/promo-codes");
  // Composant serveur, rendu une fois par requête et jamais re-rendu : l'instant
  // de la requête est la bonne référence pour dire qu'un code a expiré.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div>
      <PageHeader
        title="Codes promo"
        description="Remises applicables aux réservations en ligne."
        actions={<CreatePromoCode />}
      />

      {codes.length === 0 ? (
        <EmptyState>Aucun code promo pour l&apos;instant.</EmptyState>
      ) : (
        <Table head={["Code", "Remise", "Utilisations", "Validité", "État", ""]}>
          {codes.map((code) => (
            <Row key={code.id}>
              <Cell className="font-mono font-medium">{code.code}</Cell>
              <Cell className="whitespace-nowrap">
                {code.type === "percentage" ? `${code.value} %` : formatPrice(code.value)}
                {code.min_amount !== null && (
                  <div className="text-xs text-muted">dès {formatPrice(code.min_amount)}</div>
                )}
              </Cell>
              <Cell className="tabular-nums">
                {formatNumber(code.uses_count)}
                {code.max_uses !== null && ` / ${formatNumber(code.max_uses)}`}
                <div className="text-xs text-muted">{code.max_uses_per_user} par client</div>
              </Cell>
              <Cell className="whitespace-nowrap">
                {code.starts_at || code.expires_at
                  ? `${formatOptionalDate(code.starts_at)} → ${formatOptionalDate(code.expires_at)}`
                  : "Sans limite"}
              </Cell>
              <Cell>
                <PromoCodeState code={code} now={now} />
              </Cell>
              <Cell>
                <PromoCodeRowActions code={code} />
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

/** État réel d'utilisation : un code actif mais expiré ou épuisé ne sert plus. */
function PromoCodeState({ code, now }: { code: PromoCode; now: number }) {
  if (!code.is_active) return <Badge tone={STATUS_TONES.stopped}>Désactivé</Badge>;
  if (code.expires_at && new Date(code.expires_at).getTime() < now) return <Badge tone={STATUS_TONES.idle}>Expiré</Badge>;
  if (code.max_uses !== null && code.uses_count >= code.max_uses) return <Badge tone={STATUS_TONES.idle}>Épuisé</Badge>;
  if (code.starts_at && new Date(code.starts_at).getTime() > now) return <Badge tone={STATUS_TONES.upcoming}>À venir</Badge>;
  return <Badge tone={STATUS_TONES.done}>Actif</Badge>;
}
