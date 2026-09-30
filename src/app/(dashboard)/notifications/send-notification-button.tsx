"use client";

import { Send } from "lucide-react";
import { useMemo, useState } from "react";

import { sendNotification } from "@/app/actions/notifications";
import { Button } from "@/components/button";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import type { NotificationAudience } from "@/lib/api/types";
import { text } from "@/lib/form-data";

interface OwnerOption {
  id: string;
  label: string;
}

/**
 * Nouvelle notification push : groupée à tous les propriétaires, ou ciblée
 * sur une sélection.
 *
 * La sélection vit dans un état React plutôt que dans le formulaire : le
 * filtre de recherche masque des cases, et une case masquée ne doit pas être
 * désélectionnée pour autant.
 */
export function SendNotificationButton({
  owners,
  initialOwnerId,
}: {
  owners: OwnerOption[];
  /** Propriétaire présélectionné, depuis sa fiche : le dialogue s'ouvre ciblé. */
  initialOwnerId?: string;
}) {
  const preselected = initialOwnerId && owners.some((o) => o.id === initialOwnerId);
  const [open, setOpen] = useState(Boolean(preselected));
  const [audience, setAudience] = useState<NotificationAudience>(
    preselected ? "selected_owners" : "all_owners",
  );
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(preselected ? [initialOwnerId!] : []),
  );
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? owners.filter((o) => o.label.toLowerCase().includes(needle)) : owners;
  }, [owners, query]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setOpen(false);
    setAudience("all_owners");
    setSelected(new Set());
    setQuery("");
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Send aria-hidden className="size-4" />
        Nouvelle notification
      </Button>

      <FormDialog
        open={open}
        onClose={reset}
        title="Nouvelle notification"
        description="Elle s'affiche sur le téléphone des propriétaires ayant l'application installée et connectée."
        submitLabel={
          audience === "all_owners"
            ? "Envoyer à tous"
            : `Envoyer à ${selected.size} propriétaire${selected.size > 1 ? "s" : ""}`
        }
        successTitle="Notification envoyée"
        onSubmit={async (form) => {
          if (audience === "selected_owners" && selected.size === 0) {
            return "Choisissez au moins un propriétaire.";
          }
          return sendNotification({
            title: text(form, "title"),
            body: text(form, "body"),
            audience,
            owner_ids: [...selected],
          });
        }}
      >
        <Input label="Titre" name="title" required minLength={3} maxLength={80} data-autofocus />
        <Input label="Message" type="description" name="body" required minLength={3} maxLength={500} />
        <Select
          label="Destinataires"
          name="audience"
          value={audience}
          onChange={(event) => setAudience(event.target.value as NotificationAudience)}
          options={[
            { value: "all_owners", label: "Tous les propriétaires" },
            { value: "selected_owners", label: "Propriétaires choisis" },
          ]}
        />

        {audience === "selected_owners" && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
            </legend>
            <Input
              type="search"
              aria-label="Rechercher un propriétaire"
              placeholder="Nom, téléphone ou e-mail"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <ul className="max-h-56 overflow-y-auto border border-border">
              {visible.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">Aucun propriétaire ne correspond.</li>
              ) : (
                visible.map((owner) => (
                  <li key={owner.id} className="border-b border-border last:border-0">
                    <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-background">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={selected.has(owner.id)}
                        onChange={() => toggle(owner.id)}
                      />
                      {owner.label}
                    </label>
                  </li>
                ))
              )}
            </ul>
          </fieldset>
        )}
      </FormDialog>
    </>
  );
}
