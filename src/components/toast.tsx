"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { Toaster as SonnerToaster, toast } from "sonner";

type Tone = "success" | "error" | "info" | "warning";

const TONES: Record<Tone, { icon: typeof Info; className: string }> = {
  success: { icon: CircleCheck, className: "text-accent-green" },
  error: { icon: CircleAlert, className: "text-danger" },
  info: { icon: Info, className: "text-accent-blue" },
  warning: { icon: TriangleAlert, className: "text-accent-amber" },
};

interface NotifyOptions {
  description?: string;
  /** Millisecondes ; `Infinity` pour un toast qui attend d'être fermé. */
  duration?: number;
  /**
   * Un toast de même `id` remplace le précédent au lieu de s'empiler. Utile
   * pour un avis émis au montage, que le double rendu du mode strict
   * afficherait sinon deux fois.
   */
  id?: string;
}

/**
 * Point d'entrée unique des notifications : `notify.success("Plan créé")`.
 *
 * Sonner est employé en mode headless (`toast.custom`) : il garde le
 * positionnement, l'empilement et le glissement, et le rendu suit nos jetons
 * de thème et nos angles droits. Styler ses toasts par défaut demanderait un
 * `!important` sur chaque classe.
 *
 * Côté client seulement : une server action renvoie son résultat, et c'est
 * le composant qui la déclenche qui appelle `notify`.
 */
export const notify = {
  success: (title: string, options?: NotifyOptions) =>
    show("success", title, options),
  error: (title: string, options?: NotifyOptions) =>
    show("error", title, options),
  info: (title: string, options?: NotifyOptions) =>
    show("info", title, options),
  warning: (title: string, options?: NotifyOptions) =>
    show("warning", title, options),
};

function show(
  tone: Tone,
  title: string,
  { description, duration, id }: NotifyOptions = {},
) {
  return toast.custom(
    (toastId) => (
      <ToastCard
        id={toastId}
        tone={tone}
        title={title}
        description={description}
      />
    ),
    { duration, id },
  );
}

function ToastCard({
  id,
  tone,
  title,
  description,
}: {
  id: string | number;
  tone: Tone;
  title: string;
  description?: string;
}) {
  const { icon: Icon, className } = TONES[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      // `font-sans` : le conteneur de Sonner impose sa propre police, dont
      // la carte hériterait sinon.
      className="flex w-(--width) items-start gap-3 border border-border bg-surface p-4 font-sans text-foreground shadow-lg"
    >
      <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${className}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        aria-label="Fermer la notification"
        className="shrink-0 text-muted hover:text-foreground"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

/** À monter une seule fois, dans le layout racine : deux Toasters doublent chaque toast. */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      theme="system"
      containerAriaLabel="Notifications"
      // Sonner impose une pile de polices système sur son conteneur, dont les
      // toasts héritent ; le style en ligne l'emporte sur sa feuille injectée.
      style={{ fontFamily: "inherit" }}
    />
  );
}
