import './globals.css';

import type { Metadata } from 'next';
import {
  Geist_Mono,
  Urbanist,
} from 'next/font/google';
import { cookies } from 'next/headers';

import { Toaster } from '@/components/toast';
import { parseTheme, THEME_COOKIE } from '@/lib/theme';

// Urbanist : la police des deux applis mobiles, pour une même identité.
const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Resi Backoffice", template: "%s · Resi Backoffice" },
  description: "Administration de la plateforme Resi.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="fr"
      data-theme={theme === "system" ? undefined : theme}
      className={`${urbanist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
