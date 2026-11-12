import type {
  CommissionMode,
  DepositType,
  AuditMethod,
  AuditOutcome,
  BookingSource,
  BookingStatus,
  ClientKind,
  DepositAction,
  FeedbackStatus,
  FeedbackType,
  IdDocumentType,
  OwnerStatus,
  PlanTier,
  StayBucket,
  PromoCodeType,
  PropertyStatus,
  PropertyType,
  RedemptionStatus,
  RedemptionType,
  RewardMode,
  RoleName,
  SponsorshipRole,
  SponsorshipStatus,
  SponsorshipTrigger,
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
  full_day: "Nuitée",
  half_day: "Demi-journée",
  passage: "Passage",
};

/** Tranches de la répartition des séjours, dans l'ordre de durée. */
export const STAY_BUCKET_LABELS: Record<StayBucket, string> = {
  passage: "Passage",
  half_day: "Demi-journée",
  one_day: "1 nuitée",
  two_to_six_days: "2 à 6 jours",
  seven_to_twenty_nine_days: "7 à 29 jours",
  thirty_days_plus: "30 jours et plus",
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

export const SPONSORSHIP_ROLE_LABELS: Record<SponsorshipRole, string> = {
  client: "Client",
  proprio: "Propriétaire",
};

export const SPONSORSHIP_STATUS_LABELS: Record<SponsorshipStatus, string> = {
  registered: "Inscrit",
  pending: "Gain en attente",
  earned: "Gain acquis",
  cancelled: "Annulé",
};

export const SPONSORSHIP_TRIGGER_LABELS: Record<SponsorshipTrigger, string> = {
  booking_completed: "Séjour terminé",
  subscription_paid: "Abonnement payé",
};

export const REWARD_MODE_LABELS: Record<RewardMode, string> = {
  fixed: "Montant fixe",
  percent: "Pourcentage",
};

export const REDEMPTION_TYPE_LABELS: Record<RedemptionType, string> = {
  withdrawal: "Retrait Wave",
  stay_credit: "Crédit séjour",
  subscription_credit: "Crédit d'abonnement",
};

export const REDEMPTION_STATUS_LABELS: Record<RedemptionStatus, string> = {
  pending: "À verser",
  paid: "Versé",
  rejected: "Refusé",
  completed: "Converti",
};

/** Transforme un dictionnaire de libellés en options de liste déroulante. */
export function toOptions<K extends string>(labels: Record<K, string>) {
  return (Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label }));
}

export const AUDIT_OUTCOME_LABELS: Record<AuditOutcome, string> = {
  success: "Réussie",
  client_error: "Refusée",
  server_error: "Erreur serveur",
};

/** Le verbe HTTP dit en clair ce que la requête a voulu faire. */
export const AUDIT_METHOD_LABELS: Record<AuditMethod, string> = {
  GET: "Lecture",
  POST: "Création",
  PUT: "Remplacement",
  PATCH: "Modification",
  DELETE: "Suppression",
};

export const COMMISSION_MODE_LABELS: Record<CommissionMode, string> = {
  percent: "Pourcentage du prix par nuit",
  fixed: "Montant fixe par nuit",
};

export const DEPOSIT_TYPE_LABELS: Record<DepositType, string> = {
  percent: "Pourcentage du séjour",
  fixed: "Montant fixe",
};
