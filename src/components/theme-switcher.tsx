"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

import { writePreferenceCookie } from "@/lib/preference-cookie";
import { THEME_COOKIE, type ThemePreference } from "@/lib/theme";

const OPTIONS = [
  { value: "light", label: "Thème clair", icon: Sun },
  { value: "dark", label: "Thème sombre", icon: Moon },
  { value: "system", label: "Thème du système", icon: Monitor },
] as const satisfies { value: ThemePreference; label: string; icon: unknown }[];

/**
 * Choix du thème. Appliqué sur-le-champ à `<html>`, et mémorisé dans un
 * cookie pour que le serveur rende le bon thème dès la page suivante.
 * `initial` vient du même cookie, lu par le layout.
 */
export function ThemeSwitcher({ initial }: { initial: ThemePreference }) {
  const [theme, setTheme] = useState(initial);

  const choose = (next: ThemePreference) => {
    setTheme(next);
    writePreferenceCookie(THEME_COOKIE, next);
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <div role="group" aria-label="Thème" className="flex border border-border">
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(option.value)}
            aria-pressed={active}
            aria-label={option.label}
            title={option.label}
            className={`p-1.5 ${
              active ? "bg-primary/10 text-foreground" : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            <option.icon aria-hidden className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
