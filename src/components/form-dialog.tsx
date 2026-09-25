"use client";

import { LoaderCircle } from "lucide-react";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";

import type { ActionResult } from "@/lib/action-result";

import { Button } from "./button";
import { Dialog } from "./dialog";
import { notify } from "./toast";

export interface FormDialogProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  submitLabel: string;
  /** `danger` pour une décision irréversible (rejet, annulation). */
  tone?: "default" | "danger";
  /**
   * Lit le formulaire et appelle la server action. Un message renvoyé ici
   * (validation locale) s'affiche comme une erreur de l'API.
   */
  onSubmit: (form: FormData) => Promise<ActionResult<T> | string>;
  /** Titre du toast de succès ; le `message` de l'action en devient la description. */
  successTitle: string;
  children: ReactNode;
}

/**
 * Dialogue de saisie branché sur une server action.
 *
 * L'erreur reste dans le dialogue (un toast s'afficherait sous son fond) et
 * le toast de succès part après la fermeture. Les champs sont non contrôlés :
 * `FormData` suffit, et le démontage à la fermeture les remet à zéro.
 */
export function FormDialog<T>({
  open,
  onClose,
  title,
  description,
  submitLabel,
  tone = "default",
  onSubmit,
  successTitle,
  children,
}: FormDialogProps<T>) {
  const formId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    onClose();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(form);
      if (typeof result === "string") return setError(result);
      if (!result.ok) return setError(result.error);
      close();
      notify.success(successTitle, { description: result.message });
    });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      description={description}
      dismissible={!pending}
      className="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" form={formId} variant={tone === "danger" ? "danger" : "primary"} disabled={pending}>
            {pending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </>
      }
    >
      {/* Démonté fermé : chaque ouverture repart des valeurs initiales. */}
      {open && (
        <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
          <fieldset disabled={pending} className="contents">
            {children}
          </fieldset>
          {error && (
            <p role="alert" className="bg-danger-surface px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      )}
    </Dialog>
  );
}
