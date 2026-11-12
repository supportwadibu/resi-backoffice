"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

/*
 * `<img>` plutôt que `next/image` dans tout le fichier : photos hébergées
 * hors du domaine, sans configuration d'optimiseur.
 */

const OVERLAY_BUTTON =
  "inline-flex size-10 shrink-0 items-center justify-center bg-overlay/45 text-on-overlay backdrop-blur-sm transition hover:bg-overlay/70 focus-visible:outline-2 focus-visible:outline-on-overlay";

/** Au-delà, les segments seraient trop fins pour se lire : le compteur suffit. */
const MAX_SEGMENTS = 16;

/**
 * Galerie d'une fiche : une scène qu'on fait glisser, une pellicule de
 * vignettes pour sauter d'une photo à l'autre, et le plein écran.
 *
 * Le glissement est le défilement natif du navigateur, accroché photo par
 * photo (`scroll-snap`) : doigt, pavé tactile et molette horizontale
 * marchent sans code de geste, avec l'inertie du système.
 */
export function PhotoGallery({ images, label = "Photos du logement" }: { images: string[]; label?: string }) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const count = images.length;
  if (count === 0) return null;

  return (
    <section aria-label={label} className="grid gap-2 lg:h-[30rem] lg:grid-cols-[minmax(0,1fr)_8rem]">
      <Carousel
        images={images}
        index={index}
        onIndexChange={setIndex}
        onExpand={() => setFullscreen(true)}
        className="h-72 border border-border sm:h-96 lg:h-full"
      />
      {count > 1 && (
        <Filmstrip
          images={images}
          index={index}
          onSelect={setIndex}
          className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto"
          thumbClassName="h-16 w-24 lg:h-auto lg:w-full lg:aspect-[4/3]"
        />
      )}
      <Lightbox
        open={fullscreen}
        label={label}
        images={images}
        index={index}
        onIndexChange={setIndex}
        onClose={() => setFullscreen(false)}
      />
    </section>
  );
}

/**
 * Scène : une photo par écran, la suivante à un glissement.
 *
 * Contrôlée par `index` : une vignette choisie la fait défiler, un glissement
 * la fait remonter. Pendant un défilement commandé, les positions
 * intermédiaires ne sont pas remontées — sans quoi aller de la 1 à la 6
 * s'arrêterait à la 2, que l'index renverrait aussitôt.
 */
function Carousel({
  images,
  index,
  onIndexChange,
  onExpand,
  showCounter = true,
  className = "",
}: {
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onExpand?: () => void;
  /** Faux en plein écran, dont l'en-tête porte déjà le compteur. */
  showCounter?: boolean;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const target = useRef<number | null>(null);
  const firstScroll = useRef(true);
  const count = images.length;

  const indexRef = useRef(index);
  const positionOf = (el: HTMLElement) => Math.round(el.scrollLeft / Math.max(1, el.clientWidth));

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Recalage sur la photo courante quand la scène change de taille : fenêtre
  // redimensionnée, ou plein écran mesuré avant que son dialogue ne s'ouvre
  // (largeur nulle jusque-là).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === 0) return;
      target.current = null;
      el.scrollTo({ left: indexRef.current * el.clientWidth, behavior: "auto" });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0 || positionOf(el) === index) {
      firstScroll.current = false;
      return;
    }
    target.current = index;
    // Premier placement (plein écran ouvert sur la 5e photo) sans animation ;
    // ensuite, glissement doux, sauf si le système demande moins de mouvement.
    const instant = firstScroll.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    firstScroll.current = false;
    el.scrollTo({ left: index * el.clientWidth, behavior: instant ? "auto" : "smooth" });
  }, [index]);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const position = positionOf(el);
    if (target.current !== null) {
      if (position === target.current) target.current = null;
      return;
    }
    if (position !== index) onIndexChange(position);
  }

  // Un glissement qui interrompt un défilement commandé n'atteint jamais la
  // cible : la fin du défilement fait foi.
  function handleScrollEnd() {
    const el = scrollerRef.current;
    if (!el) return;
    target.current = null;
    const position = positionOf(el);
    if (position !== index) onIndexChange(position);
  }

  const step = useCallback(
    (delta: number) => onIndexChange((index + delta + count) % count),
    [index, count, onIndexChange],
  );

  function handleKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  }

  return (
    <div className={`group relative overflow-hidden bg-overlay ${className}`}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onScrollEnd={handleScrollEnd}
        onKeyDown={handleKey}
        tabIndex={0}
        role="region"
        aria-roledescription="carrousel"
        aria-label={`Photo ${index + 1} sur ${count}`}
        className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none [scrollbar-width:none] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-on-overlay [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <figure key={`${src}-${i}`} className="relative size-full shrink-0 snap-center snap-always overflow-hidden">
            {/* Fond tiré de la photo elle-même, flouté : une photo en hauteur
                garde toute son image sans flotter sur des bandes noires. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- voir l'en-tête du fichier */}
            <img
              src={src}
              alt=""
              aria-hidden
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- voir l'en-tête du fichier */}
            <img
              src={src}
              alt={`Photo ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              className="relative size-full object-contain select-none"
            />
          </figure>
        ))}
      </div>

      {count > 1 && count <= MAX_SEGMENTS && (
        <div aria-hidden className="pointer-events-none absolute inset-x-3 top-3 flex gap-1">
          {images.map((src, i) => (
            <span
              key={`${src}-${i}`}
              className={`h-0.5 flex-1 transition-colors duration-300 ${
                i === index ? "bg-on-overlay" : i < index ? "bg-on-overlay/60" : "bg-on-overlay/25"
              }`}
            />
          ))}
        </div>
      )}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Photo précédente"
            className={`${OVERLAY_BUTTON} absolute top-1/2 left-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:hidden`}
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Photo suivante"
            className={`${OVERLAY_BUTTON} absolute top-1/2 right-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:hidden`}
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </>
      )}

      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        {showCounter ? (
          <span className="bg-overlay/45 px-2 py-1 text-xs font-medium text-on-overlay tabular-nums backdrop-blur-sm">
            {String(index + 1).padStart(2, "0")}
            <span className="text-on-overlay/60"> / {String(count).padStart(2, "0")}</span>
          </span>
        ) : (
          <span />
        )}
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label="Afficher en plein écran"
            className={`${OVERLAY_BUTTON} pointer-events-auto size-9`}
          >
            <Expand aria-hidden className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Pellicule : la vignette active est cerclée, les autres en retrait. */
function Filmstrip({
  images,
  index,
  onSelect,
  className,
  thumbClassName,
  tone = "page",
}: {
  images: string[];
  index: number;
  onSelect: (index: number) => void;
  className: string;
  thumbClassName: string;
  /** `overlay` : posée sur le fond sombre du plein écran. */
  tone?: "page" | "overlay";
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // La pellicule suit la scène : la vignette active reste visible.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [index]);

  const ring = tone === "overlay" ? "outline-on-overlay" : "outline-primary";

  return (
    <div role="group" aria-label="Choisir une photo" className={`[scrollbar-width:thin] ${className}`}>
      {images.map((src, i) => {
        const active = i === index;
        return (
          <button
            key={`${src}-${i}`}
            ref={active ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Photo ${i + 1}`}
            aria-current={active ? "true" : undefined}
            className={`relative shrink-0 overflow-hidden bg-overlay outline-offset-[-2px] transition ${thumbClassName} ${
              active ? `outline-2 ${ring}` : "opacity-50 hover:opacity-100 focus-visible:opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- voir l'en-tête du fichier */}
            <img src={src} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Plein écran : la même scène, la pellicule dessous.
 *
 * `<dialog>` natif en `showModal()` : page inerte derrière, Échap, focus
 * rendu au bouton d'origine à la fermeture.
 */
function Lightbox({
  open,
  label,
  images,
  index,
  onIndexChange,
  onClose,
}: {
  open: boolean;
  label: string;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = images.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Le focus va à la scène : les flèches du clavier y répondent d'emblée.
      dialog.querySelector<HTMLElement>("[aria-roledescription=carrousel]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      // Échap déclenche `cancel` : on l'annule pour que l'état React reste la
      // seule source de vérité.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none bg-transparent p-0 text-on-overlay backdrop:bg-overlay"
    >
      {open && (
        <div className="flex size-full flex-col gap-3 p-3 sm:p-4">
          <div className="flex items-center justify-between text-sm tabular-nums">
            <span className="font-medium">
              {String(index + 1).padStart(2, "0")}
              <span className="text-on-overlay/60"> / {String(count).padStart(2, "0")}</span>
            </span>
            <button type="button" onClick={onClose} aria-label="Fermer" className={OVERLAY_BUTTON}>
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <Carousel
            images={images}
            index={index}
            onIndexChange={onIndexChange}
            showCounter={false}
            className="min-h-0 flex-1"
          />

          {count > 1 && (
            <Filmstrip
              images={images}
              index={index}
              onSelect={onIndexChange}
              tone="overlay"
              className="mx-auto flex max-w-full gap-2 overflow-x-auto pb-1"
              thumbClassName="h-14 w-20 sm:h-16 sm:w-24"
            />
          )}
        </div>
      )}
    </dialog>
  );
}
