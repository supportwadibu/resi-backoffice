"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { notify } from "@/components/toast";
import { formatPrice } from "@/lib/format";

import { SECTION_ICONS } from "./navigation";

interface PendingWithdrawal {
  id: string;
  owner_name: string | null;
  net_amount: number;
  created_at: string;
}

/**
 * Relevé toutes les minutes : une demande de retrait attend un virement
 * manuel, une minute de délai ne change rien pour le propriétaire et épargne
 * l'API.
 */
const POLL_MS = 60_000;

/**
 * Alerte des demandes de retrait en attente : compteur dans l'en-tête et
 * toast à chaque nouvelle demande, tant que le backoffice est ouvert.
 *
 * Les demandes déjà vues au premier relevé ne déclenchent pas de toast : à
 * chaque ouverture, l'administrateur serait sinon notifié de tout l'arriéré.
 */
export function WithdrawalAlerts() {
  const [count, setCount] = useState(0);
  const seen = useRef<Set<string> | null>(null);
  const Icon = SECTION_ICONS.withdrawals;

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch("/api/alertes/retraits", { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { count: number; latest: PendingWithdrawal[] };
        if (cancelled) return;

        setCount(body.count);
        const previous = seen.current;
        seen.current = new Set([...(previous ?? []), ...body.latest.map((w) => w.id)]);
        if (!previous) return;

        for (const withdrawal of body.latest.filter((w) => !previous.has(w.id))) {
          notify.info("Nouvelle demande de retrait", {
            description: `${withdrawal.owner_name ?? "Un propriétaire"} · ${formatPrice(withdrawal.net_amount)} à verser`,
          });
        }
      } catch {
        // Réseau coupé ou session expirée : l'alerte se tait, la page reste
        // utilisable, et le relevé suivant réessaie.
      }
    }

    poll();
    const timer = window.setInterval(poll, POLL_MS);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const label =
    count === 0
      ? "Aucune demande de retrait en attente"
      : `${count} demande${count > 1 ? "s" : ""} de retrait en attente`;

  return (
    <Link
      href="/retraits?status=pending"
      title={label}
      aria-label={label}
      className="relative flex size-9 items-center justify-center border border-border text-muted hover:text-foreground"
    >
      <Icon aria-hidden className="size-4" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 bg-accent-amber px-1 text-center text-[11px] font-semibold leading-5 text-background tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
