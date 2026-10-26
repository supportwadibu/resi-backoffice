import type {
  BookingSource,
  BookingStatus,
  ClientKind,
  DepositAction,
  FeedbackStatus,
  FeedbackType,
  IdDocumentType,
  OwnerStatus,
  PlanTier,
  PromoCodeType,
  PropertyStatus,
  PropertyType,
  RoleName,
  StayType,
  SubscriptionStatus,
  WithdrawalStatus,
} from "@/lib/api/types";

/**
 * Libellés d'affichage des codes de l'API.
 *
 * L'API renvoie des codes stables et laisse le libellé au client : ils vivent
 * ici, une fois, pour que listes, filtres et fiches disent la même chose.
 */

export const ROLE_LABELS: Record<RoleName, string> = {
  admin: "Administrateur",
  proprio: "Propriétaire",
  gerant: "Gérant",
  client: "Client",
};

export const OWNER_STATUS_LABELS: Record<OwnerStatus, string> = {
  pending: "En attente",
  active: "Validé",
  rejected: "Rejeté",
  suspended: "Suspendu",
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: "Brouillon",
  published: "En ligne",
  reserved: "Réservé",
  rented: "Loué",
  maintenance: "En travaux",
  inactive: "Inactif",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Appartement",
  studio: "Studio",
  villa: "Villa",
  duplex: "Duplex",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  online: "En ligne",
  offline: "Comptoir",
};

/** Sort, à l'annulation, de ce que le client avait versé. */
export const DEPOSIT_ACTION_LABELS: Record<DepositAction, string> = {
  keep: "Gardé par le propriétaire",
  refund: "Rendu au client",
};

export const STAY_TYPE_LABELS: Record<StayType, string> = {
  full_day: "Journée",
  half_day: "Demi-journée",
  passage: "Passage",
};

export const CLIENT_KIND_LABELS: Record<ClientKind, string> = {
  account: "Compte",
  carnet: "Carnet",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  pending: "En attente",
  trial: "Essai",
  active: "Actif",
  expired: "Expiré",
  cancelled: "Annulé",
};

/**
 * Motifs de clôture posés par l'API. Un motif saisi par l'équipe à
 * l'annulation, absent d'ici, s'affiche tel quel.
 */
export const SUBSCRIPTION_CANCEL_REASON_LABELS: Record<string, string> = {
  owner_cancelled: "Résilié par le propriétaire",
  upgraded: "Remplacé par un forfait supérieur",
  renewed: "Renouvelé",
  upgraded_to_plan: "Essai remplacé par un forfait",
  superseded: "Remplacé",
  admin_cancel: "Annulé par l'équipe",
};

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: "À verser",
  paid: "Versé",
  rejected: "Refusé",
};

export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  pro: "RESI Pro — 3 000 F",
  pro_plus: "RESI Pro+ — 5 000 F",
};

export const PROMO_TYPE_LABELS: Record<PromoCodeType, string> = {
  percentage: "Pourcentage",
  fixed: "Montant fixe",
};

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  suggestion: "Suggestion",
  bug: "Bug",
  amelioration: "Amélioration",
  autre: "Autre",
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "Nouveau",
  read: "Lu",
  in_progress: "En cours",
  closed: "Clos",
};

export const ID_DOCUMENT_LABELS: Record<IdDocumentType, string> = {
  cni: "Carte nationale d'identité",
  passport: "Passeport",
  driving_licence: "Permis de conduire",
};

/** Transforme un dictionnaire de libellés en options de liste déroulante. */
export function toOptions<K extends string>(labels: Record<K, string>) {
  return (Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label }));
}
