import type {
  BookingStatus,
  FeedbackStatus,
  OwnerStatus,
  PlanTier,
  PropertyStatus,
  SubscriptionStatus,
} from "@/lib/api/types";
import {
  BOOKING_STATUS_LABELS,
  FEEDBACK_STATUS_LABELS,
  OWNER_STATUS_LABELS,
  PLAN_TIER_LABELS,
  PROPERTY_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/labels";

import { Badge, type BadgeTone } from "./badge";

/**
 * Grammaire des statuts : une couleur porte le même sens dans toutes les
 * familles, si bien qu'on lit une liste sans connaître son vocabulaire. Un
 * statut se range selon ce qu'il dit du cycle de vie, pas selon sa famille.
 *
 * Tout badge de statut, y compris calculé dans une page, passe par ces tons.
 */
export const STATUS_TONES = {
  /** Abouti ou en règle : terminé, clos, validé, actif, en ligne. */
  done: "green",
  /** En cours d'exécution : séjour en cours, logement loué, essai. */
  ongoing: "violet",
  /** Planifié ou pris en compte, rien à faire pour l'instant. */
  upcoming: "blue",
  /** Attend une action, ou indisponible le temps d'une intervention. */
  waiting: "amber",
  /** Arrêté par une décision : annulé, rejeté, suspendu, désactivé. */
  stopped: "red",
  /** Hors circuit sans incident : brouillon, inactif, expiré. */
  idle: "neutral",
} as const satisfies Record<string, BadgeTone>;

const T = STATUS_TONES;

export const OWNER_TONES: Record<OwnerStatus, BadgeTone> = {
  pending: T.waiting,
  active: T.done,
  rejected: T.stopped,
  suspended: T.stopped,
};

export const PROPERTY_TONES: Record<PropertyStatus, BadgeTone> = {
  draft: T.idle,
  published: T.done,
  reserved: T.upcoming,
  rented: T.ongoing,
  maintenance: T.waiting,
  inactive: T.idle,
};

export const BOOKING_TONES: Record<BookingStatus, BadgeTone> = {
  confirmed: T.upcoming,
  in_progress: T.ongoing,
  completed: T.done,
  cancelled: T.stopped,
};

export const SUBSCRIPTION_TONES: Record<SubscriptionStatus, BadgeTone> = {
  pending: T.waiting,
  trial: T.ongoing,
  active: T.done,
  expired: T.idle,
  cancelled: T.stopped,
};

/**
 * Le forfait complet est « en règle » ; le forfait d'enregistrement n'est ni
 * arrêté ni hors circuit : il est actif, simplement réduit — bleu.
 */
export const PLAN_TIER_TONES: Record<PlanTier, BadgeTone> = {
  full: T.done,
  basic: T.upcoming,
};

export const FEEDBACK_TONES: Record<FeedbackStatus, BadgeTone> = {
  new: T.waiting,
  read: T.upcoming,
  in_progress: T.ongoing,
  closed: T.done,
};

export function OwnerStatusBadge({ status }: { status: OwnerStatus }) {
  return <Badge tone={OWNER_TONES[status]}>{OWNER_STATUS_LABELS[status]}</Badge>;
}

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <Badge tone={PROPERTY_TONES[status]}>{PROPERTY_STATUS_LABELS[status]}</Badge>;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={BOOKING_TONES[status]}>{BOOKING_STATUS_LABELS[status]}</Badge>;
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge tone={SUBSCRIPTION_TONES[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Badge>;
}

export function PlanTierBadge({ tier }: { tier: PlanTier }) {
  return <Badge tone={PLAN_TIER_TONES[tier]}>{PLAN_TIER_LABELS[tier]}</Badge>;
}

export function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return <Badge tone={FEEDBACK_TONES[status]}>{FEEDBACK_STATUS_LABELS[status]}</Badge>;
}

/** Désactiver un compte est une sanction : rouge, et non neutre comme un plan inactif. */
export function ActiveBadge({ active }: { active: boolean }) {
  return active ? <Badge tone={T.done}>Actif</Badge> : <Badge tone={T.stopped}>Désactivé</Badge>;
}
