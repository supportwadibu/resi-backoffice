import type { SessionUser } from "@/lib/auth/tokens";

import { LogoutButton } from "./logout-button";

/** Identité de l'administrateur connecté et déconnexion. */
export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center border border-border bg-background text-sm font-semibold"
        >
          {initials(user.full_name)}
        </span>
        <div className="hidden min-w-0 text-sm sm:block">
          <div className="truncate font-medium">{user.full_name}</div>
          {/* Un admin créé par téléphone n'a pas forcément d'e-mail. */}
          <div className="truncate text-xs text-muted">{user.email ?? user.phone ?? "Administrateur"}</div>
        </div>
      </div>

      <div aria-hidden className="h-6 w-px bg-border" />

      <LogoutButton />
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((part) => part[0]).join("").toUpperCase() || "?";
}
