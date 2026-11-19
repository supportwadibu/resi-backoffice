"use client";

import { CheckCircle2, LoaderCircle, Mail, RotateCw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  grantSubscription,
  requestSubscriptionGrantCode,
} from "@/app/actions/subscriptions";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Section } from "@/components/page-header";
import { Select } from "@/components/select";
import { PlanTierBadge } from "@/components/status-badges";
import { notify } from "@/components/toast";
import type { ManualPaymentMethod, Owner, Plan, SubscriptionGrantCode } from "@/lib/api/types";
import { formatDateTime, formatNumber, formatPrice } from "@/lib/format";
import { MANUAL_PAYMENT_METHOD_LABELS, OWNER_STATUS_LABELS, toOptions } from "@/lib/labels";

/**
 * Enregistrement d'un abonnement en deux temps : choix du propriétaire, du
 * forfait et du montant, puis code reçu par e-mail.
 *
 * Le code est lié par l'API au propriétaire, au forfait et au montant : en
 * changer un après l'envoi remet le formulaire à la première étape, plutôt
 * que de laisser valider un code que l'API refuserait.
 */
export function GrantSubscriptionForm({
  owners,
  plans,
  initialOwnerId,
}: {
  owners: Owner[];
  plans: Plan[];
  initialOwnerId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [ownerId, setOwnerId] = useState(
    owners.some((owner) => owner.id === initialOwnerId) ? initialOwnerId! : "",
  );
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const plan = plans.find((p) => p.id === planId);
  const [amountText, setAmountText] = useState(String(plans[0]?.price ?? ""));
  const [method, setMethod] = useState<ManualPaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const [sent, setSent] = useState<SubscriptionGrantCode | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const owner = owners.find((o) => o.id === ownerId);
  const amount = Number(amountText);
  const amountValid = amountText.trim() !== "" && Number.isInteger(amount) && amount >= 0;

  const ownerOptions = useMemo(
    () =>
      owners.map((o) => ({
        value: o.id,
        label: [o.full_name || "Sans nom", o.phone ?? o.email, OWNER_STATUS_LABELS[o.owner_status]]
          .filter(Boolean)
          .join(" · "),
      })),
    [owners],
  );

  /** Tout changement de choix invalide le code déjà envoyé. */
  function changed<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      if (sent) {
        setSent(null);
        setCode("");
      }
      setError(null);
    };
  }

  function pickPlan(next: Plan) {
    changed(setPlanId)(next.id);
    // Le montant suit le prix du forfait ; l'administrateur le corrige ensuite
    // s'il a accordé une remise.
    setAmountText(String(next.price));
  }

  function fail(title: string, message: string) {
    setError(message);
    notify.error(title, { description: message });
  }

  function requestCode() {
    if (!owner) return fail("Choix incomplet", "Choisissez un propriétaire.");
    if (!plan) return fail("Choix incomplet", "Choisissez un forfait.");
    if (!amountValid) return fail("Montant invalide", "Le montant doit être un nombre entier de francs, 0 ou plus.");

    startTransition(async () => {
      const result = await requestSubscriptionGrantCode({ user_id: owner.id, plan_id: plan.id, amount });
      if (!result.ok) return fail("Code non envoyé", result.error);
      setSent(result.data);
      setCode("");
      setError(null);
      notify.info("Code envoyé", { description: `Consultez la boîte ${result.data.email}.` });
    });
  }

  function confirm() {
    if (!sent || !owner || !plan) return;
    if (!/^\d{6}$/.test(code)) return fail("Code incomplet", "Le code compte 6 chiffres.");

    startTransition(async () => {
      const result = await grantSubscription({
        user_id: owner.id,
        plan_id: plan.id,
        amount,
        payment_method: method,
        payment_reference: reference.trim(),
        note: note.trim(),
        code,
      });
      if (!result.ok) return fail("Abonnement non enregistré", result.error);
      notify.success("Abonnement enregistré", {
        description: `${owner.full_name} · ${plan.name} · ${formatPrice(amount)}`,
      });
      router.push(`/abonnements?user_id=${encodeURIComponent(owner.id)}`);
    });
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <Section title="1. Propriétaire">
        {owners.length === 0 ? (
          <p className="text-sm text-muted">Aucun propriétaire actif.</p>
        ) : (
          <Select
            label="Propriétaire"
            value={ownerId}
            onChange={(event) => changed(setOwnerId)(event.target.value)}
            placeholder="Choisir un propriétaire"
            options={ownerOptions}
            disabled={pending}
            required
          />
        )}
      </Section>

      <Section title="2. Forfait">
        {plans.length === 0 ? (
          <p className="text-sm text-muted">Aucun forfait actif : créez-en un dans Plans.</p>
        ) : (
          <div role="radiogroup" aria-label="Forfait" className="grid gap-2 sm:grid-cols-2">
            {plans.map((p) => {
              const selected = p.id === planId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={pending}
                  onClick={() => pickPlan(p)}
                  className={`flex flex-col items-start gap-2 border p-4 text-left transition-colors disabled:opacity-60 ${
                    selected
                      ? "border-primary bg-background"
                      : "border-border bg-surface hover:bg-background"
                  }`}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-semibold">{p.name}</span>
                    <PlanTierBadge tier={p.tier} />
                  </span>
                  <span className="text-lg font-semibold tabular-nums">{formatPrice(p.price)}</span>
                  <span className="text-sm text-muted">
                    {formatNumber(p.duration_days)} jours · {formatNumber(p.max_residences)} résidence
                    {p.max_residences > 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="3. Encaissement">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Montant reçu (F CFA)"
            type="number"
            min={0}
            step={1}
            value={amountText}
            onChange={(event) => changed(setAmountText)(event.target.value)}
            disabled={pending}
            hint={
              plan && amountValid && amount !== plan.price
                ? `Prix du forfait : ${formatPrice(plan.price)}. 0 pour un abonnement offert.`
                : "0 pour un abonnement offert."
            }
            error={amountValid || amountText === "" ? undefined : "Nombre entier de francs, 0 ou plus."}
            required
          />
          <Select
            label="Moyen de paiement"
            value={method}
            onChange={(event) => setMethod(event.target.value as ManualPaymentMethod)}
            options={toOptions(MANUAL_PAYMENT_METHOD_LABELS)}
            disabled={pending || amount === 0}
          />
          <Input
            label="Référence (facultatif)"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            maxLength={120}
            disabled={pending || amount === 0}
            hint="Numéro de reçu ou de transaction."
          />
          <Input
            label="Note (facultatif)"
            type="description"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            disabled={pending}
            hint="Conservée dans l'historique de l'abonnement."
          />
        </div>
        <p className="mt-4 text-sm text-muted">
          Aucun remboursement automatique : résilié, cet abonnement court jusqu&apos;à son échéance.
        </p>
      </Section>

      <Section title="4. Validation" icon={ShieldCheck}>
        {!sent ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted">
              Un code à 6 chiffres sera envoyé à votre adresse e-mail d&apos;administrateur.
            </p>
            <Button onClick={requestCode} disabled={pending || !owner || !plan || !amountValid}>
              {pending ? (
                <LoaderCircle aria-hidden className="size-4 animate-spin" />
              ) : (
                <Mail aria-hidden className="size-4" />
              )}
              Recevoir le code
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm">
              Code envoyé à <strong>{sent.email}</strong>, valable jusqu&apos;à{" "}
              {formatDateTime(sent.expires_at)}. Il ne vaut que pour{" "}
              <strong>{owner?.full_name}</strong>, <strong>{plan?.name}</strong> et{" "}
              <strong>{formatPrice(sent.amount)}</strong>.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-40">
                <Input
                  label="Code reçu"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={pending}
                  data-autofocus
                  autoFocus
                />
              </div>
              <Button onClick={confirm} disabled={pending || code.length !== 6}>
                {pending ? (
                  <LoaderCircle aria-hidden className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 aria-hidden className="size-4" />
                )}
                Valider l&apos;enregistrement
              </Button>
              <Button variant="ghost" onClick={requestCode} disabled={pending}>
                <RotateCw aria-hidden className="size-4" />
                Renvoyer le code
              </Button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}
      </Section>
    </div>
  );
}
