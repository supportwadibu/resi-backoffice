import type {
  BookingSource,
  BookingStatus,
  ClientKind,
  FeedbackStatus,
  FeedbackType,
  Furnishing,
  IdDocumentType,
  OwnerStatus,
  PlanTier,
  PromoCodeType,
  PropertyStatus,
  PropertyType,
  RoleName,
  StayType,
  SubscriptionStatus,
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

export const FURNISHING_LABELS: Record<Furnishing, string> = {
  unfurnished: "Non meublé",
  semi_furnished: "Semi-meublé",
  furnished: "Meublé",
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

export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  basic: "3 000 F — enregistrement",
  full: "5 000 F — complet",
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
