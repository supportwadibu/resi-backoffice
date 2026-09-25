import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SIDEBAR_COOKIE } from "@/components/shell/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { getCurrentUser } from "@/lib/auth/session";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  // Le proxy filtre déjà sur le rôle porté par le jeton ; ce contrôle couvre
  // un rôle retiré depuis l'émission du jeton, que seule l'API connaît.
  if (user.role !== "admin") redirect("/session-expiree");

  const cookieStore = await cookies();
  // Dépliée par défaut : seul un repli explicite, mémorisé, la réduit.
  const collapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed";
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  // Cadre à la hauteur de la fenêtre : barre latérale et en-tête restent en
  // place, seul `<main>` défile. Next.js retrouve ce conteneur pour remonter
  // en haut d'une nouvelle page.
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar defaultCollapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} theme={theme} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
