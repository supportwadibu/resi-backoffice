"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/logo";

import { NavLinks } from "./nav-links";
import { SidebarBrand } from "./sidebar";

/**
 * Navigation des petits écrans : un tiroir sur `<dialog>` natif, pour les
 * mêmes raisons que `Dialog` (piège du focus, page inerte, Échap, retour du
 * focus au bouton d'ouverture).
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Masqué au-delà de `lg`, le tiroir resterait modal et rendrait la page
  // inerte sans rien afficher : un élargissement de la fenêtre le referme.
  useEffect(() => {
    if (!open) return;
    const wide = window.matchMedia("(width >= 64rem)");
    const onChange = () => {
      if (wide.matches) setOpen(false);
    };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="-ml-2 p-2 text-muted hover:bg-background hover:text-foreground lg:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      <dialog
        ref={ref}
        aria-label="Menu"
        // Échap déclenche `cancel` : annulé pour que l'état React reste la
        // seule source de vérité.
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        // Un clic sur le fond atteint le `<dialog>` lui-même, jamais son contenu.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="m-0 h-dvh max-h-none w-72 max-w-[calc(100%-3rem)] border-r border-border bg-surface p-0 text-foreground backdrop:bg-overlay/60 open:flex open:flex-col lg:hidden"
      >
        <SidebarBrand
          actions={
            <button
              type="button"
              onClick={close}
              aria-label="Fermer le menu"
              className="-mr-2 p-2 text-muted hover:text-foreground"
            >
              <X aria-hidden className="size-5" />
            </button>
          }
        >
          <Logo height={24} />
        </SidebarBrand>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <NavLinks onNavigate={close} />
        </div>
      </dialog>
    </>
  );
}
