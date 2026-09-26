/**
 * Contrats de l'API consommés par le backoffice.
 *
 * Recopiés des DTO de l'API (`api/app/features/<feature>/dto/`) : les deux
 * dépôts ne partagent pas de code, une modification de contrat s'y reporte à
 * la main. Les dates arrivent sérialisées en chaînes ISO.
 */

export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Palier d'un plan : `basic` (3 000 F) couvre l'enregistrement, `full`
 * (5 000 F) toute l'application propriétaire. L'API lit `full` un plan créé
 * avant les paliers.
 */
export type PlanTier = "basic" | "full";

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  max_residences: number;
  features: string[];
  tier: PlanTier;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FeedbackType = "suggestion" | "bug" | "amelioration" | "autre";
export type FeedbackStatus = "new" | "read" | "in_progress" | "closed";

export interface Feedback {
  id: string;
  type: FeedbackType;
  title: string;
  message: string;
  status: FeedbackStatus;
  user_id: string;
  user_snapshot: {
    full_name: string;
    phone: string | null;
    email: string | null;
  };
  admin_note: string | null;
  context: FeedbackContext;
  created_at: string;
  updated_at: string;
}

export interface FeedbackContext {
  app_version: string | null;
  /** `dev` | `staging` | `prod` — un bug de staging n'a pas la même urgence. */
  flavor: string | null;
  platform: string | null;
  os_version: string | null;
  device_model: string | null;
}

// ── Comptes ────────────────────────────────────────────────────────────────

export type RoleName = "admin" | "proprio" | "client" | "gerant";
export type AuthChannel = "email" | "phone" | "google";
export type OwnerStatus = "pending" | "active" | "rejected" | "suspended";

export interface User {
  id: string;
  role: RoleName;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  auth_channel: AuthChannel;
  is_verified: boolean;
  is_active: boolean;
  /** `null` hors rôle `proprio`. */
  owner_status: OwnerStatus | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSummary {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
}

/** Les blocs propres à un rôle valent `null` pour les autres. */
export interface UserDetail extends User {
  /** Sessions non révoquées, tous appareils confondus. */
  active_sessions: number;
  owner: {
    profile_submitted: boolean;
    validated_by: string | null;
    validated_at: string | null;
    rejection_reason: string | null;
    subscription: Subscription | null;
  } | null;
  manager_assignment: {
    owner: UserSummary | null;
    owner_id: string;
    property_ids: string[];
    is_active: boolean;
  } | null;
}

// ── Propriétaires ──────────────────────────────────────────────────────────

export interface Owner {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  owner_status: OwnerStatus;
  validated_by: string | null;
  validated_at: string | null;
  rejection_reason: string | null;
  last_login_at: string | null;
  /** Dossier déposé — distinct du statut, qui reste `pending` avant et après. */
  profile_submitted: boolean;
  created_at: string;
  updated_at: string;
}

export type IdDocumentType = "cni" | "passport" | "driving_licence";

/** Dossier de validation ; les pièces sont des URLs signées à durée limitée. */
export interface OwnerProfile {
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  id_document_type: IdDocumentType | null;
  id_document_number: string | null;
  id_document_front_url: string | null;
  id_document_back_url: string | null;
  submitted_at: string | null;
  is_submitted: boolean;
  owner_status: OwnerStatus;
  rejection_reason: string | null;
}

export interface OwnerPortfolio {
  residences: ResidenceWithUnits[];
  /** Logements hors résidence, orphelins compris. */
  standalone: PropertySummary[];
  totals: { residences: number; properties: number; standalone: number };
}

/** Réponse de `POST /admin/owners/:id/validate`. */
export interface ValidateOwnerResult {
  data: Owner;
  trial_started: boolean;
  trial_end_date: string | null;
  message: string;
}

// ── Catalogue ──────────────────────────────────────────────────────────────

export type PropertyStatus =
  | "draft"
  | "published"
  | "reserved"
  | "rented"
  | "maintenance"
  | "inactive";
export type PropertyType = "apartment" | "studio" | "villa" | "duplex";
export type Furnishing = "unfurnished" | "semi_furnished" | "furnished";

export interface PropertySummary {
  id: string;
  title: string;
  /** Nom de l'unité dans sa résidence — « Studio 1 ». */
  unit_label: string | null;
  property_type: PropertyType;
  status: PropertyStatus;
  daily_price: number;
  city: string;
  image: string | null;
  residence_id: string | null;
}

export interface ResidenceSummary {
  id: string;
  name: string;
  city: string;
}

export interface Property {
  id: string;
  owner_id: string;
  residence_id: string | null;
  unit_label: string | null;
  title: string;
  description: string;
  property_type: PropertyType;
  status: PropertyStatus;
  address: {
    street: string;
    city: string;
    country?: string;
    postal_code?: string;
  };
  details: {
    surface_area?: number;
    bedrooms: number;
    bathrooms: number;
    living_rooms: number;
    kitchens: number;
    parking_spaces: number;
    floor_number?: number;
    total_floors?: number;
    year_built?: number;
    furnishing?: Furnishing;
  };
  amenities: Record<string, boolean | undefined>;
  media: { images?: string[]; videos?: string[] };
  pricing: {
    daily_price: number;
    price_tiers?: { min_days: number; discount_percent: number }[] | null;
    minimum_stay_days?: number;
    maximum_stay_days?: number | null;
  };
  charges_included: boolean;
  additional_charges: number;
  available_from: string;
  visibility: { is_public: boolean; featured: boolean; published_at: string | null };
  metadata: { views_count: number; contact_requests_count: number; last_viewed_at: string | null };
  created_at: string;
  updated_at: string;
}

export interface PlatformProperty extends Property {
  owner: UserSummary | null;
  /** `null` avec un `residence_id` renseigné : rattachement orphelin. */
  residence: ResidenceSummary | null;
}

export interface Residence {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    country: string;
    postal_code: string | null;
  };
  media: { images: string[]; videos: string[] };
  amenities: Record<string, boolean>;
  units_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResidenceWithUnits extends Residence {
  units: PropertySummary[];
}

export interface PlatformResidence extends ResidenceWithUnits {
  owner: UserSummary | null;
}

/**
 * `account` : compte de l'application (réservation en ligne) ; `carnet` :
 * fiche du carnet d'un propriétaire (réservation au comptoir).
 */
export type ClientKind = "account" | "carnet";

export interface PropertyClient {
  client_id: string;
  kind: ClientKind;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  /** Annulations exclues. */
  stats: { total_stays: number; total_paid: number; last_stay_at: string | null };
  /** Annulations comprises. */
  bookings_count: number;
  last_booking: { id: string; status: BookingStatus; start_date: string; end_date: string };
}

export interface PropertyClients {
  property: PropertySummary;
  data: PropertyClient[];
  meta: { total: number };
}

// ── Réservations ───────────────────────────────────────────────────────────

export type BookingStatus = "confirmed" | "in_progress" | "cancelled" | "completed";
export type BookingSource = "online" | "offline";
export type StayType = "full_day" | "half_day" | "passage";

export interface PlatformBooking {
  id: string;
  property_id: string;
  residence_id: string | null;
  owner_id: string;
  client_id: string;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  days_count: number;
  daily_price: number;
  duration_discount_percent: number;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  promo_code: string | null;
  message: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  /** Absent sur l'historique antérieur au comptoir, tout en ligne. */
  source?: BookingSource;
  stay_type?: StayType;
  check_in_at?: string;
  check_out_at?: string;
  /** Sortie réellement constatée, distincte de la période facturée. */
  actual_check_out_at?: string;
  /** Présents seulement après un départ anticipé. */
  planned_check_out_at?: string;
  planned_days_count?: number;
  planned_total_amount?: number;
  refunded_amount: number;
  expected_amount?: number;
  received_amount?: number;
  deposit_amount?: number;
  /** Apporteur d'affaire, saisi librement à la création. */
  referrer: { name: string; phone: string | null } | null;
  /** Taux figé à la création, entre 0 et 1 ; 0 sans apporteur. */
  referrer_commission_rate: number;
  /** Commission due, recalculée par l'API quand le total du séjour change. */
  referrer_commission_amount: number;
  property: PropertySummary | null;
  /** Résidence figée à la création de la réservation. */
  residence: ResidenceSummary | null;
  owner: UserSummary | null;
  client: {
    id: string;
    kind: ClientKind;
    full_name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

// ── Abonnements et codes promo ─────────────────────────────────────────────

export type SubscriptionStatus = "pending" | "trial" | "active" | "expired" | "cancelled";

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  is_trial: boolean;
  status: SubscriptionStatus;
  amount: number;
  /** Palier figé à la souscription ; `full` pour un essai et l'historique. */
  plan_tier: PlanTier;
  start_date: string;
  end_date: string;
  trial_ends_at: string | null;
  payment_reference: string | null;
  auto_renew: boolean;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type PromoCodeType = "percentage" | "fixed";

export interface PromoCode {
  id: string;
  code: string;
  type: PromoCodeType;
  value: number;
  min_amount: number | null;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Statistiques ───────────────────────────────────────────────────────────

export interface RevenueStats {
  current_month: number;
  previous_month: number;
  /** `null` quand le mois précédent est à zéro : une croissance depuis rien n'a pas de valeur. */
  growth_percent: number | null;
}

export interface PlatformStats {
  generated_at: string;
  users: {
    total: number;
    by_role: Record<RoleName, number>;
    new_this_month: number;
    inactive: number;
  };
  owners: Record<OwnerStatus, number>;
  catalog: {
    residences: number;
    properties: number;
    properties_by_status: Record<PropertyStatus, number>;
  };
  bookings: {
    total: number;
    by_status: Record<BookingStatus, number>;
    by_source: Record<BookingSource, number>;
  };
  revenue: RevenueStats;
  /** De 0 à 1, sur les jours écoulés du mois et le parc exploité. */
  occupancy_rate: number;
  subscriptions: Record<SubscriptionStatus, number>;
  feedbacks: { new: number };
}

export interface RevenuePoint {
  /** `AAAA-MM`, en UTC. */
  month: string;
  revenue: number;
  bookings_started: number;
}

export interface RevenueSeries {
  months: number;
  /** Du mois le plus ancien au mois en cours. */
  data: RevenuePoint[];
  total: number;
}
