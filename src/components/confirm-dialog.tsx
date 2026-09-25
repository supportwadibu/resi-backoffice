"use client";

import { LoaderCircle } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "./button";
import { Dialog } from "./dialog";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Action confirmée. Si elle renvoie une promesse, le dialogue reste ouvert,
   * boutons désactivés, jusqu'à son issue : fermé sur succès, ouvert sur
   * échec avec le message de l'erreur levée, pour permettre de réessayer.
   */
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` pour une action destructrice ou irréversible. */
  tone?: "default" | "danger";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "default",
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    onClose();
  }

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      close();
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "L'opération a échoué. Réessayez.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      description={description}
      dismissible={!pending}
      footer={
        <>
          <Button
            className="cursor-pointer"
            variant="secondary"
            onClick={close}
            disabled={pending}
            data-autofocus={tone === "danger" || undefined}
          >
            {cancelLabel}
          </Button>
          <Button
            className="cursor-pointer"
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={confirm}
            disabled={pending}
            data-autofocus={tone !== "danger" || undefined}
          >
            {pending && (
              <LoaderCircle aria-hidden className="size-4 animate-spin" />
            )}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error && (
        <p
          role="alert"
          className="bg-danger-surface px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </Dialog>
  );
}
