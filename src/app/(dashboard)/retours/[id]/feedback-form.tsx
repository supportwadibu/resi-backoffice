"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import { updateFeedback } from "@/app/actions/feedbacks";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { notify } from "@/components/toast";
import { text } from "@/lib/form-data";
import type { Feedback, FeedbackStatus } from "@/lib/api/types";
import { FEEDBACK_STATUS_LABELS, toOptions } from "@/lib/labels";

/** Traitement d'un retour : statut et note interne, jamais montrée à l'auteur. */
export function FeedbackForm({ feedback }: { feedback: Feedback }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const note = text(form, "admin_note");
    setError(null);
    startTransition(async () => {
      const result = await updateFeedback(feedback.id, {
        status: text(form, "status") as FeedbackStatus,
        // Une note vidée s'efface plutôt que de rester en chaîne vide.
        admin_note: note || null,
      });
      if (!result.ok) return setError(result.error);
      notify.success("Retour mis à jour");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset disabled={pending} className="contents">
        <Select
          label="Statut"
          name="status"
          defaultValue={feedback.status}
          options={toOptions(FEEDBACK_STATUS_LABELS)}
        />
        <Input
          label="Note interne"
          type="description"
          name="admin_note"
          maxLength={2000}
          defaultValue={feedback.admin_note ?? ""}
          hint="Visible de l'équipe seulement."
        />
      </fieldset>
      {error && (
        <p role="alert" className="bg-danger-surface px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden className="size-4" />
          )}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
