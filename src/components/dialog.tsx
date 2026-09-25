"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

export interface DialogProps {
  open: boolean;
  /** Appelé sur Échap, clic hors du panneau ou bouton de fermeture. */
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /**
   * Boutons d'action, alignés à droite sous le contenu. Marquer d'un
   * `data-autofocus` l'élément à focaliser à l'ouverture ; sinon, le premier
   * élément focalisable (le bouton de fermeture) le reçoit.
   */
  footer?: ReactNode;
  /** Faux pendant une action en cours : ni Échap ni clic extérieur ne ferment. */
  dismissible?: boolean;
  className?: string;
}

/**
 * Fenêtre modale sur l'élément `<dialog>` natif.
 *
 * `showModal()` apporte gratuitement ce qu'une bibliothèque réimplémenterait :
 * couche supérieure (aucun z-index à gérer), piège du focus, page inerte
 * derrière, fermeture par Échap et retour du focus à l'élément d'origine.
 *
 * Revers de la couche supérieure : un toast émis dialogue ouvert s'affiche
 * sous son fond. Une erreur survenue dans un dialogue s'affiche dans le
 * dialogue ; le toast attend sa fermeture.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  className = "",
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // `autoFocus` de React ne sert à rien ici : il appelle `focus()` au
      // montage, dialogue encore fermé, sans écrire l'attribut que
      // `showModal()` consulterait. D'où ce marqueur explicite.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Échap déclenche `cancel` : on l'annule pour que l'état React reste la
      // seule source de vérité, puis on laisse le parent décider.
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      // Un clic sur le fond atteint le `<dialog>` lui-même, jamais son contenu.
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] max-w-md border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-overlay/60 ${className}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="-m-1 p-1 text-muted hover:text-foreground"
            >
              <X aria-hidden className="size-5" />
            </button>
          )}
        </div>

        {description && (
          <div id={descriptionId} className="mt-2 text-sm text-muted">
            {description}
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}
      </div>

      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
      )}
    </dialog>
  );
}
