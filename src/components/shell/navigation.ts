import {
  BedDouble,
  Building2,
  CalendarCheck,
  CreditCard,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  TicketPercent,
  UserCheck,
  Users,
} from "lucide-react";

/**
 * État replié de la barre latérale. Un cookie plutôt que `localStorage` : le
 * layout le lit côté serveur et rend d'emblée la bonne largeur, sans que la
 * barre se replie sous les yeux au chargement. Simple préférence d'affichage,
 * lisible par le JavaScript client.
 */
export const SIDEBAR_COOKIE = "resi_sidebar";

/**
 * Icône de chaque section, reprise hors de la navigation (tuiles, répartitions
 * du tableau de bord) : une section garde la même icône partout.
 */
export const SECTION_ICONS = {
  dashboard: LayoutDashboard,
  owners: UserCheck,
  users: Users,
  residences: Building2,
  properties: BedDouble,
  bookings: CalendarCheck,
  subscriptions: CreditCard,
  plans: Layers,
  promoCodes: TicketPercent,
  feedbacks: MessageSquare,
} satisfies Record<string, LucideIcon>;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Sections du backoffice, par groupe. Une nouvelle section se déclare ici. */
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Pilotage",
    items: [{ href: "/", label: "Tableau de bord", icon: SECTION_ICONS.dashboard }],
  },
  {
    label: "Utilisateurs",
    items: [
      { href: "/proprietaires", label: "Propriétaires", icon: SECTION_ICONS.owners },
      { href: "/comptes", label: "Comptes", icon: SECTION_ICONS.users },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/residences", label: "Résidences", icon: SECTION_ICONS.residences },
      { href: "/logements", label: "Logements", icon: SECTION_ICONS.properties },
    ],
  },
  {
    label: "Activité",
    items: [
      { href: "/reservations", label: "Réservations", icon: SECTION_ICONS.bookings },
      { href: "/retours", label: "Retours", icon: SECTION_ICONS.feedbacks },
    ],
  },
  {
    label: "Offre",
    items: [
      { href: "/abonnements", label: "Abonnements", icon: SECTION_ICONS.subscriptions },
      { href: "/plans", label: "Plans", icon: SECTION_ICONS.plans },
      { href: "/codes-promo", label: "Codes promo", icon: SECTION_ICONS.promoCodes },
    ],
  },
];

/**
 * `/` ne couvre que lui-même, sans quoi il serait actif partout. Les autres
 * sections couvrent leurs fiches ; le `/` final évite qu'une section en
 * englobe une autre dont le nom la prolonge.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_GROUPS.flatMap((group) => group.items).find((item) =>
    isNavItemActive(item.href, pathname),
  );
}
