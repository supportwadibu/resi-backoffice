import { ThemeSwitcher } from "@/components/theme-switcher";
import type { SessionUser } from "@/lib/auth/tokens";
import type { ThemePreference } from "@/lib/theme";

import { Breadcrumb } from "./breadcrumb";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

/** En-tête du tableau de bord, fixe au-dessus du contenu qui défile. */
export function Topbar({ user, theme }: { user: SessionUser; theme: ThemePreference }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 md:px-8">
      <MobileNav />
      <Breadcrumb />
      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <ThemeSwitcher initial={theme} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
