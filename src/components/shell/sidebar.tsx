"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/logo";
import { writePreferenceCookie } from "@/lib/preference-cookie";

import { NavLinks } from "./nav-links";
import { SIDEBAR_COOKIE } from "./navigation";

/**
 * Barre latérale des grands écrans. Elle ne défile pas avec le contenu ; sa
 * liste défile seule si la hauteur de la fenêtre ne suffit pas.
 *
 * Repliée, elle ne garde que les icônes. `defaultCollapsed` vient du cookie,
 * lu par le layout.
 */
export function Sidebar({ defaultCollapsed }: { defaultCollapsed: boolean }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    writePreferenceCookie(SIDEBAR_COOKIE, next ? "collapsed" : "expanded");
  };

  const label = collapsed ? "Déplier le menu" : "Replier le menu";

  return (
    <aside
      className={`hidden shrink-0 flex-col overflow-hidden border-r border-border bg-surface transition-[width] duration-200 motion-reduce:transition-none lg:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <SidebarBrand
        actions={
          <button
            type="button"
            onClick={toggle}
            aria-label={label}
            aria-expanded={!collapsed}
            title={label}
            className={`p-2 text-muted hover:bg-background hover:text-foreground ${collapsed ? "" : "-mr-2"}`}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden className="size-4" />
            ) : (
              <PanelLeftClose aria-hidden className="size-4" />
            )}
          </button>
        }
      >
        {!collapsed && <Logo height={26} eager />}
      </SidebarBrand>
      <div className={`flex-1 overflow-x-hidden overflow-y-auto py-5 ${collapsed ? "px-2" : "px-3"}`}>
        <NavLinks collapsed={collapsed} />
      </div>
    </aside>
  );
}

/**
 * Bandeau du logo, à la hauteur de l'en-tête (`h-16`) : les deux bordures
 * basses se prolongent d'une colonne à l'autre. Sans logo, seules les actions
 * restent, centrées.
 */
export function SidebarBrand({ children, actions }: { children?: ReactNode; actions?: ReactNode }) {
  return (
    <div
      className={`flex h-16 shrink-0 items-center gap-2 border-b border-border ${
        children ? "justify-between px-6" : "justify-center"
      }`}
    >
      {children && (
        <Link href="/" aria-label="Tableau de bord" className="shrink-0">
          {children}
        </Link>
      )}
      {actions}
    </div>
  );
}
