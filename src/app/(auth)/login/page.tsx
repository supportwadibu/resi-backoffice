import { Check } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";

import { Logo } from "@/components/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

const HIGHLIGHTS = [
  "Plans d'abonnement et tarifs des propriétaires",
  "Retours des utilisateurs, du signalement au suivi",
  "Vue d'ensemble de l'activité de la plateforme",
] as const;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, expiree } = await searchParams;
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <main className="grid flex-1 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-overlay lg:flex">
        <Image
          src="/images/detail_1.png"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-overlay/95 via-overlay/50 to-overlay/20" />
        <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-overlay/70 to-transparent" />

        <div className="relative flex flex-1 flex-col p-12 text-on-overlay">
          <Logo height={36} onMedia />

          <div className="mt-auto max-w-md">
            <h2 className="text-3xl leading-tight font-semibold">
              Toute la plateforme Resi, depuis un seul espace.
            </h2>
            <p className="mt-3 text-on-overlay/75">
              Suivez les propriétaires, leurs abonnements et les retours de la
              communauté.
            </p>

            <ul className="mt-8 flex flex-col gap-3 text-sm">
              {HIGHLIGHTS.map((label) => (
                <li key={label} className="flex items-center gap-3">
                  <Check aria-hidden className="size-4 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-12 text-xs text-on-overlay/60">
            © {new Date().getFullYear()} Resi
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="absolute top-4 right-4">
          <ThemeSwitcher initial={theme} />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo height={36} eager />
          </div>

          <h1 className="text-2xl font-semibold">Connexion</h1>
          <p className="mt-1 text-sm text-muted">
            Espace réservé aux administrateurs.
          </p>

          <LoginForm
            next={typeof next === "string" ? next : undefined}
            expired={Boolean(expiree)}
          />
        </div>
      </section>
    </main>
  );
}
