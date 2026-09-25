"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, NAV_GROUPS } from "./navigation";

/**
 * `collapsed` : icônes seules, le libellé passe en infobulle et reste lu par
 * les lecteurs d'écran. Les groupes ne sont plus séparés que par un filet.
 *
 * `onNavigate` : le tiroir mobile se referme sur un clic, même vers la page courante.
 */
export function NavLinks({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale" className={`flex flex-col ${collapsed ? "gap-3" : "gap-5"}`}>
      {NAV_GROUPS.map((group, index) => (
        <div key={group.label}>
          {collapsed ? (
            index > 0 && <div aria-hidden className="mx-2 mb-3 border-t border-border" />
          ) : (
            <p className="px-3 pb-1.5 text-xs font-medium tracking-wider whitespace-nowrap text-muted uppercase">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isNavItemActive(item.href, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 border-l-2 py-2 text-sm whitespace-nowrap ${
                      collapsed ? "justify-center" : "px-3"
                    } ${
                      active
                        ? "border-primary bg-primary/10 font-medium text-foreground"
                        : "border-transparent text-muted hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <item.icon aria-hidden className="size-4 shrink-0" />
                    <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
