"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";

import { updateSponsorshipSettings } from "@/app/actions/sponsorships";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import type {
  RedemptionType,
  RewardMode,
  RewardRule,
  SponsorshipRole,
  SponsorshipSettings,
} from "@/lib/api/types";
import { number, text } from "@/lib/form-data";
import { REDEMPTION_TYPE_LABELS, REWARD_MODE_LABELS, toOptions } from "@/lib/labels";

/** Usages ouverts à chaque rôle, comme l'API : un client n'a pas d'abonnement. */
const OPTIONS_BY_ROLE: Record<SponsorshipRole, RedemptionType[]> = {
  client: ["withdrawal", "stay_credit"],
  proprio: ["withdrawal", "subscription_credit"],
};

const ROLES: { role: SponsorshipRole; sponsored: string; sponsor: string }[] = [
  {
    role: "client",
    sponsored: "Filleul client — séjour réservé en ligne, payé et terminé",
    sponsor: "Parrain client",
  },
  {
    role: "proprio",
    sponsored: "Filleul propriétaire — abonnement payé",
    sponsor: "Parrain propriétaire",
  },
];

/** Lit le formulaire ; une chaîne est un message d'erreur à afficher. */
function readSettings(form: FormData): Omit<SponsorshipSettings, "updated_at"> | string {
  const integer = (name: string, min: number, max: number, label: string) => {
    const value = number(form, name);
    if (value === null || !Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${label} : un entier entre ${min} et ${max}.`);
    }
    return value;
  };

  try {
    const reward = (role: SponsorshipRole): RewardRule => {
      const mode = text(form, `${role}_mode`) as RewardMode;
      const value = number(form, `${role}_value`);
      if (value === null || value < 0 || (mode === "percent" && value > 100)) {
        throw new Error(
          mode === "percent"
            ? "Un pourcentage se règle entre 0 et 100."
            : "Le gain est un montant positif.",
        );
      }
      const cap = text(form, `${role}_max_amount`);
      return {
        mode,
        value,
        max_amount: cap === "" ? null : integer(`${role}_max_amount`, 0, 1_000_000, "Plafond"),
        hold_days: integer(`${role}_hold_days`, 0, 90, "Délai d'attente"),
      };
    };
    const redemption = (role: SponsorshipRole) => ({
      minimum_amount: integer(`${role}_minimum`, 100, 1_000_000, "Seuil"),
      options: OPTIONS_BY_ROLE[role].filter((option) => form.get(`${role}_${option}`) === "on"),
    });

    return {
      enabled: form.get("enabled") === "on",
      rewards: { client: reward("client"), proprio: reward("proprio") },
      redemption: { client: redemption("client"), proprio: redemption("proprio") },
      attach_window_days: integer("attach_window_days", 0, 365, "Délai de saisie d'un code"),
    };
  } catch (error) {
    return (error as Error).message;
  }
}

/** Réglages du programme : gains, délais et usages, sans redéploiement. */
export function SponsorshipSettingsButton({ settings }: { settings: SponsorshipSettings }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Settings2 aria-hidden className="size-4" />
        Réglages
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Réglages du parrainage"
        description="Valent pour les gains à venir. Un gain déjà acquis garde la règle de son attribution."
        submitLabel="Enregistrer"
        successTitle="Réglages du parrainage enregistrés"
        onSubmit={async (form) => {
          const input = readSettings(form);
          return typeof input === "string" ? input : updateSponsorshipSettings(input);
        }}
      >
        <div className="space-y-6">
          <Checkbox
            label="Gains activés"
            name="enabled"
            defaultChecked={settings.enabled}
            hint="Coupés, les parrainages continuent d'être enregistrés ; aucun gain n'est attribué."
          />

          {ROLES.map(({ role, sponsored }) => {
            const rule = settings.rewards[role];
            return (
              <fieldset key={role} className="space-y-3 border border-border p-4">
                <legend className="px-1 text-sm font-medium">{sponsored}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Type de gain"
                    name={`${role}_mode`}
                    defaultValue={rule.mode}
                    options={toOptions(REWARD_MODE_LABELS)}
                  />
                  <Input
                    label="Valeur (F ou %)"
                    type="number"
                    name={`${role}_value`}
                    defaultValue={rule.value}
                    min={0}
                    step="any"
                    required
                  />
                  <Input
                    label="Plafond d'un gain en % (F)"
                    type="number"
                    name={`${role}_max_amount`}
                    defaultValue={rule.max_amount ?? ""}
                    min={0}
                    step={1}
                    hint="Vide : sans plafond."
                  />
                  <Input
                    label="Délai d'attente (jours)"
                    type="number"
                    name={`${role}_hold_days`}
                    defaultValue={rule.hold_days}
                    min={0}
                    max={90}
                    step={1}
                    required
                    hint="Le temps qu'un remboursement reste possible."
                  />
                </div>
              </fieldset>
            );
          })}

          {ROLES.map(({ role, sponsor }) => {
            const rule = settings.redemption[role];
            return (
              <fieldset key={role} className="space-y-3 border border-border p-4">
                <legend className="px-1 text-sm font-medium">{sponsor} — usage des gains</legend>
                <Input
                  label="Seuil d'une demande (F)"
                  type="number"
                  name={`${role}_minimum`}
                  defaultValue={rule.minimum_amount}
                  min={100}
                  step={1}
                  required
                />
                {OPTIONS_BY_ROLE[role].map((option) => (
                  <Checkbox
                    key={option}
                    label={REDEMPTION_TYPE_LABELS[option]}
                    name={`${role}_${option}`}
                    defaultChecked={rule.options.includes(option)}
                  />
                ))}
              </fieldset>
            );
          })}

          <Input
            label="Délai de saisie d'un code après l'inscription (jours)"
            type="number"
            name="attach_window_days"
            defaultValue={settings.attach_window_days}
            min={0}
            max={365}
            step={1}
            required
          />
        </div>
      </FormDialog>
    </>
  );
}
