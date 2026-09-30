"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const OVERLAY_BUTTON =
  "inline-flex size-10 shrink-0 items-center justify-center text-on-overlay/80 hover:bg-on-overlay/10 hover:text-on-overlay";

/**
 * Bandeau de vignettes ; un clic ouvre la photo en plein écran, avec
 * navigation aux flèches du clavier.
 *
 * `<img>` plutôt que `next/image` : images hébergées hors du domaine, sans
 * configuration d'optimiseur.
 */
export function PhotoGallery({ images }: { images: string[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const count = images.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // `showModal()` rend la page inerte et rend le focus à la vignette
    // d'origine à la fermeture.
    if (index !== null && !dialog.open) dialog.showModal();
    if (index === null && dialog.open) dialog.close();
  }, [index]);

  const close = () => setIndex(null);
  const step = (delta: number) =>
    setIndex((current) => (current === null ? null : (current + delta + count) % count));

  return (
    <>
      <div className="flex gap-2 overflow-x-auto">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Agrandir la photo ${i + 1}`}
            className="shrink-0 cursor-zoom-in border border-border hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- voir le commentaire du composant */}
            <img src={src} alt={`Photo ${i + 1}`} className="h-40 w-auto object-cover" />
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Photos du logement"
        // Échap déclenche `cancel` : on l'annule pour que l'état React reste la
        // seule source de vérité.
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") step(-1);
          if (event.key === "ArrowRight") step(1);
        }}
        // Le panneau couvre toute la fenêtre : un clic hors de la photo et des
        // boutons tombe sur le dialogue ou sur la scène.
        onClick={(event) => {
          if (event.target === event.currentTarget || event.target === stageRef.current) close();
        }}
        className="fixed inset-0 m-0 size-full max-h-none max-w-none bg-transparent p-0 text-on-overlay backdrop:bg-overlay/90"
      >
        {index !== null && (
          <div className="flex size-full flex-col">
            <div className="flex items-center justify-between px-4 py-3 text-sm tabular-nums">
              <span>
                {index + 1} / {count}
              </span>
              <button type="button" onClick={close} aria-label="Fermer" className={OVERLAY_BUTTON}>
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <div ref={stageRef} className="flex min-h-0 flex-1 items-center justify-center gap-2 px-2 pb-6">
              {count > 1 && (
                <button type="button" onClick={() => step(-1)} aria-label="Photo précédente" className={OVERLAY_BUTTON}>
                  <ChevronLeft aria-hidden className="size-6" />
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- voir le commentaire du composant */}
              <img
                src={images[index]}
                alt={`Photo ${index + 1}`}
                className="mx-auto max-h-full min-w-0 max-w-full object-contain"
              />
              {count > 1 && (
                <button type="button" onClick={() => step(1)} aria-label="Photo suivante" className={OVERLAY_BUTTON}>
                  <ChevronRight aria-hidden className="size-6" />
                </button>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
