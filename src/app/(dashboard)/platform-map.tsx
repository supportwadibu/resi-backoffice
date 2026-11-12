"use client";

import { MarkerClusterer, type Renderer } from "@googlemaps/markerclusterer";
import {
  AdvancedMarker,
  APIProvider,
  ColorScheme,
  ControlPosition,
  Map,
  MapControl,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import {
  ArrowUpRight,
  BedDouble,
  Building2,
  Expand,
  MapPinOff,
  TriangleAlert,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { Checkbox } from "@/components/checkbox";
import { Input } from "@/components/input";
import { PropertyStatusBadge } from "@/components/status-badges";
import type { MapPoint } from "@/lib/api/types";
import { formatNumber, formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/labels";

/** Abidjan : centre de départ, avant que la carte ne cadre les lieux. */
const ABIDJAN = { lat: 5.3364, lng: -3.9772 };

/** Zoom auquel un lieu choisi dans la liste sort de son groupe. */
const FOCUS_ZOOM = 16;

type KindFilter = "all" | MapPoint["kind"];

const KINDS: Record<MapPoint["kind"], { label: string; plural: string; icon: LucideIcon }> = {
  residence: { label: "Résidence", plural: "Résidences", icon: Building2 },
  property: { label: "Logement", plural: "Logements", icon: BedDouble },
};

export interface PlatformMapProps {
  points: MapPoint[];
  withoutCoordinates: number;
  truncated: boolean;
  /** Vide : la carte cède la place à un avis, la liste reste utilisable. */
  apiKey: string;
  mapId: string;
}

/**
 * Carte des résidences et logements de la plateforme : recherche et filtres
 * dans la colonne, points regroupés sur la carte, fiche du lieu choisi.
 *
 * Tout est filtré dans le navigateur : l'API rend tous les points d'un coup,
 * et la recherche doit suivre la frappe sans aller-retour.
 */
export function PlatformMap({ points, withoutCoordinates, truncated, apiKey, mapId }: PlatformMapProps) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Incrémenté quand le lieu est choisi dans la liste : la carte s'y rend.
  // Un clic sur un marqueur ne le touche pas — le lieu est déjà sous les yeux.
  const [focusRequest, setFocusRequest] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const keyRefused = useKeyRefused();

  const counts = useMemo(
    () => ({
      all: points.length,
      residence: points.filter((p) => p.kind === "residence").length,
      property: points.filter((p) => p.kind === "property").length,
    }),
    [points],
  );

  const visible = useMemo(() => {
    const needle = normalize(deferredQuery);
    return points.filter(
      (p) =>
        (kind === "all" || p.kind === kind) &&
        (!onlyPublished || p.published_count > 0) &&
        (!needle || searchText(p).includes(needle)),
    );
  }, [points, kind, onlyPublished, deferredQuery]);

  const selected = visible.find((p) => p.id === selectedId) ?? null;
  // Clé de cadrage : la carte recadre quand l'ensemble affiché change, pas
  // quand on choisit un lieu.
  const fitKey = `${kind}|${onlyPublished}|${normalize(deferredQuery)}`;

  function choose(id: string) {
    setSelectedId(id);
    setFocusRequest((n) => n + 1);
  }

  return (
    <div className="grid border border-border bg-surface lg:h-[600px] lg:grid-cols-[22rem_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-b border-border lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <Input
            type="search"
            aria-label="Rechercher un lieu"
            placeholder="Nom, ville, rue, propriétaire…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div role="group" aria-label="Type de lieu" className="grid grid-cols-3 border border-border">
            {(["all", "residence", "property"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
                className={`flex flex-col items-center px-2 py-1.5 text-xs transition-colors not-first:border-l not-first:border-border ${
                  kind === value ? "bg-primary text-primary-foreground" : "hover:bg-background"
                }`}
              >
                <span className="font-medium">{value === "all" ? "Tout" : KINDS[value].plural}</span>
                <span className={kind === value ? "opacity-80" : "text-muted"}>{formatNumber(counts[value])}</span>
              </button>
            ))}
          </div>
          <Checkbox
            label="Réservables seulement"
            hint="Au moins un logement publié."
            checked={onlyPublished}
            onChange={(event) => setOnlyPublished(event.target.checked)}
          />
        </div>

        <p className="border-b border-border px-4 py-2 text-xs text-muted" aria-live="polite">
          {visible.length === 0
            ? "Aucun lieu ne correspond."
            : `${formatNumber(visible.length)} lieu${visible.length > 1 ? "x" : ""} sur la carte`}
        </p>

        <ul className="max-h-72 min-h-0 flex-1 overflow-y-auto lg:max-h-none">
          {visible.map((point) => (
            <li key={point.id}>
              <PointRow point={point} active={point.id === selectedId} onSelect={() => choose(point.id)} />
            </li>
          ))}
        </ul>

        {(withoutCoordinates > 0 || truncated) && (
          <div className="flex flex-col gap-1 border-t border-border px-4 py-2 text-xs text-muted">
            {withoutCoordinates > 0 && (
              <p>
                {formatNumber(withoutCoordinates)} lieu{withoutCoordinates > 1 ? "x" : ""} sans coordonnées, absent
                {withoutCoordinates > 1 ? "s" : ""} de la carte.
              </p>
            )}
            {truncated && (
              <p className="flex items-center gap-1 text-accent-amber">
                <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
                Carte incomplète : la limite de lecture est atteinte.
              </p>
            )}
          </div>
        )}
      </aside>

      <div className="relative h-[460px] lg:h-full">
        {apiKey && !keyRefused ? (
          <APIProvider apiKey={apiKey} language="fr" region="CI">
            <MapCanvas
              mapId={mapId}
              points={visible}
              selected={selected}
              fitKey={fitKey}
              focusRequest={focusRequest}
              onSelect={setSelectedId}
            />
          </APIProvider>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-background p-6 text-center">
            <MapPinOff aria-hidden className="size-6 text-muted" />
            <p className="font-medium">Carte indisponible</p>
            <p className="max-w-sm text-sm text-muted">
              {keyRefused ? (
                <>
                  Google a refusé la clé. Autorisez « Maps JavaScript API » et le domaine du backoffice pour cette clé
                  dans la console Google Cloud.
                </>
              ) : (
                <>
                  Renseignez <code>GOOGLE_MAPS_API_KEY</code> dans l&apos;environnement du backoffice.
                </>
              )}{" "}
              La liste des lieux reste consultable.
            </p>
          </div>
        )}

        {selected && <PointCard point={selected} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  );
}

function MapCanvas({
  mapId,
  points,
  selected,
  fitKey,
  focusRequest,
  onSelect,
}: {
  mapId: string;
  points: MapPoint[];
  selected: MapPoint | null;
  fitKey: string;
  focusRequest: number;
  onSelect: (id: string | null) => void;
}) {
  const colorScheme = useColorScheme();

  return (
    <Map
      // Le schéma de couleurs ne se change pas sur une carte créée : la clé
      // la recrée quand le thème bascule.
      key={colorScheme}
      mapId={mapId}
      colorScheme={colorScheme}
      defaultCenter={ABIDJAN}
      defaultZoom={11}
      // Le tableau de bord défile : la molette seule ne doit pas zoomer la
      // carte au passage.
      gestureHandling="cooperative"
      disableDefaultUI
      zoomControl
      fullscreenControl
      clickableIcons={false}
      onClick={() => onSelect(null)}
      className="h-full w-full"
    >
      <ClusteredMarkers points={points} selectedId={selected?.id ?? null} onSelect={onSelect} />
      <Camera points={points} selected={selected} fitKey={fitKey} focusRequest={focusRequest} />
    </Map>
  );
}

/** Cadrage : sur l'ensemble affiché quand il change, sur un lieu choisi dans la liste. */
function Camera({
  points,
  selected,
  fitKey,
  focusRequest,
}: {
  points: MapPoint[];
  selected: MapPoint | null;
  fitKey: string;
  focusRequest: number;
}) {
  const map = useMap();
  const [overview, setOverview] = useState(0);

  const fit = useCallback(() => {
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.setCenter({ lat: points[0].latitude, lng: points[0].longitude });
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const p of points) bounds.extend({ lat: p.latitude, lng: p.longitude });
    map.fitBounds(bounds, 56);
    // `points` lu au moment du cadrage ; recadrer à chaque nouvelle liste
    // ferait sauter la carte pendant la frappe, d'où `fitKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey, overview]);

  useEffect(fit, [fit]);

  useEffect(() => {
    if (!map || !selected || focusRequest === 0) return;
    map.panTo({ lat: selected.latitude, lng: selected.longitude });
    if ((map.getZoom() ?? 0) < FOCUS_ZOOM) map.setZoom(FOCUS_ZOOM);
    // Seule une demande nouvelle déplace la carte, pas un nouveau rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, focusRequest]);

  return (
    <MapControl position={ControlPosition.TOP_LEFT}>
      <button
        type="button"
        onClick={() => setOverview((n) => n + 1)}
        className="m-3 flex items-center gap-2 border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-background"
      >
        <Expand aria-hidden className="size-4" />
        Tout afficher
      </button>
    </MapControl>
  );
}

/**
 * Marqueurs regroupés par proximité : à l'échelle du pays, des centaines de
 * lieux d'Abidjan se recouvriraient. Les marqueurs restent des composants
 * React ; le regroupeur ne fait que les rattacher à la carte ou à un groupe.
 */
function ClusteredMarkers({
  points,
  selectedId,
  onSelect,
}: {
  points: MapPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const markerLibrary = useMapsLibrary("marker");
  const [markers, setMarkers] = useState<Record<string, google.maps.marker.AdvancedMarkerElement>>({});

  const clusterer = useMemo(() => {
    if (!map || !markerLibrary) return null;
    return new MarkerClusterer({ map, renderer: clusterRenderer(markerLibrary) });
  }, [map, markerLibrary]);

  useEffect(() => () => clusterer?.setMap(null), [clusterer]);

  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  const setMarkerRef = useCallback((marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
    setMarkers((current) => {
      if ((marker && current[id] === marker) || (!marker && !current[id])) return current;
      if (marker) return { ...current, [id]: marker };
      const rest = { ...current };
      delete rest[id];
      return rest;
    });
  }, []);

  return points.map((point) => (
    <PointMarker
      key={point.id}
      point={point}
      active={point.id === selectedId}
      onSelect={() => onSelect(point.id)}
      setMarkerRef={setMarkerRef}
    />
  ));
}

function PointMarker({
  point,
  active,
  onSelect,
  setMarkerRef,
}: {
  point: MapPoint;
  active: boolean;
  onSelect: () => void;
  setMarkerRef: (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => void;
}) {
  // Référence stable : une fonction recréée à chaque rendu ferait détacher
  // puis rattacher le marqueur au regroupeur, sans fin.
  const ref = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null) => setMarkerRef(marker, point.id),
    [setMarkerRef, point.id],
  );
  const Icon = KINDS[point.kind].icon;

  return (
    <AdvancedMarker
      ref={ref}
      position={{ lat: point.latitude, lng: point.longitude }}
      title={point.name}
      zIndex={active ? 1000 : undefined}
      onClick={onSelect}
      className="group"
    >
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center gap-1.5 border shadow-md transition-transform duration-150 group-hover:-translate-y-0.5 ${
            active
              ? "scale-110 border-primary bg-primary px-2 py-1 text-primary-foreground"
              : point.kind === "residence"
                ? "border-primary bg-primary p-1.5 text-primary-foreground"
                : "border-border bg-surface p-1.5 text-foreground"
          }`}
        >
          <Icon aria-hidden className="size-4" />
          {active && <span className="max-w-40 truncate text-xs font-semibold">{point.name}</span>}
          {!active && point.kind === "residence" && point.units_count > 1 && (
            <span className="text-[11px] font-semibold tabular-nums">{point.units_count}</span>
          )}
        </div>
        {/* Pointe du repère, qui désigne l'adresse exacte. */}
        <div
          aria-hidden
          className={`-mt-1 size-2 rotate-45 border-r border-b ${
            active || point.kind === "residence" ? "border-primary bg-primary" : "border-border bg-surface"
          }`}
        />
      </div>
    </AdvancedMarker>
  );
}

/** Groupe de lieux : un carré noir chiffré, plus grand quand il en compte plus. */
function clusterRenderer(library: google.maps.MarkerLibrary): Renderer {
  return {
    render({ count, position }) {
      const size = count < 10 ? 32 : count < 100 ? 40 : 48;
      const content = document.createElement("div");
      content.className =
        "flex items-center justify-center border-2 border-surface bg-primary text-sm font-semibold text-primary-foreground shadow-md tabular-nums";
      content.style.width = `${size}px`;
      content.style.height = `${size}px`;
      content.textContent = String(count);
      return new library.AdvancedMarkerElement({
        position,
        content,
        title: `${count} lieux — cliquer pour zoomer`,
        zIndex: 500 + count,
      });
    },
  };
}

function PointRow({ point, active, onSelect }: { point: MapPoint; active: boolean; onSelect: () => void }) {
  const Icon = KINDS[point.kind].icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex w-full items-start gap-3 border-b border-l-2 border-b-border px-4 py-3 text-left transition-colors ${
        active ? "border-l-primary bg-background" : "border-l-transparent hover:bg-background"
      }`}
    >
      <span
        aria-hidden
        className={`flex size-8 shrink-0 items-center justify-center ${
          point.kind === "residence"
            ? "bg-accent-violet-soft text-accent-violet"
            : "bg-accent-blue-soft text-accent-blue"
        }`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{point.name || "Sans nom"}</span>
        <span className="block truncate text-xs text-muted">
          {[point.city, point.owner?.full_name].filter(Boolean).join(" · ") || "—"}
        </span>
      </span>
      <span className="shrink-0 text-right text-xs">
        {point.min_daily_price !== null ? (
          <span className="block font-medium tabular-nums">{formatPrice(point.min_daily_price)}</span>
        ) : (
          <span className="block text-muted">Non publié</span>
        )}
        {point.kind === "residence" && (
          <span className="block text-muted">
            {point.units_count} unité{point.units_count > 1 ? "s" : ""}
          </span>
        )}
      </span>
    </button>
  );
}

/** Fiche du lieu choisi, posée sur la carte. */
function PointCard({ point, onClose }: { point: MapPoint; onClose: () => void }) {
  const kind = KINDS[point.kind];
  const href = point.kind === "residence" ? `/residences/${point.id}` : `/logements/${point.id}`;

  return (
    <article className="absolute right-3 bottom-3 left-3 flex max-w-md border border-border bg-surface shadow-lg sm:left-auto sm:w-96">
      {point.image ? (
        // Photo hébergée chez Cloudinary : `next/image` exigerait de déclarer
        // le domaine, pour une vignette déjà dimensionnée par l'hébergeur.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={point.image} alt="" className="w-28 shrink-0 object-cover" />
      ) : (
        <div aria-hidden className="flex w-28 shrink-0 items-center justify-center bg-background text-muted">
          <kind.icon className="size-6" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">
              {kind.label}
              {point.property_type && ` · ${PROPERTY_TYPE_LABELS[point.property_type]}`}
            </p>
            <h3 className="truncate font-semibold">{point.name || "Sans nom"}</h3>
            <p className="truncate text-xs text-muted">{[point.street, point.city].filter(Boolean).join(", ")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fiche"
            className="-m-1 p-1 text-muted hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {point.status ? (
            <PropertyStatusBadge status={point.status} />
          ) : (
            <span>
              <span className="font-semibold tabular-nums">{point.published_count}</span>
              <span className="text-muted"> / {point.units_count} publiée{point.units_count > 1 ? "s" : ""}</span>
            </span>
          )}
          {point.min_daily_price !== null && (
            <span>
              <span className="text-muted">dès </span>
              <span className="font-semibold tabular-nums">{formatPrice(point.min_daily_price)}</span>
              <span className="text-muted"> / jour</span>
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 text-sm">
          {point.owner ? (
            <Link
              href={`/proprietaires/${point.owner.id}`}
              className="flex min-w-0 items-center gap-1.5 text-muted hover:text-foreground"
            >
              <UserRound aria-hidden className="size-4 shrink-0" />
              <span className="truncate">{point.owner.full_name}</span>
            </Link>
          ) : (
            <span />
          )}
          <Link href={href} className="flex shrink-0 items-center gap-1 font-medium underline-offset-4 hover:underline">
            Fiche
            <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Minuscules et sans accents : « Cocody » se trouve en tapant « cocody ». */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function searchText(point: MapPoint): string {
  return normalize(
    [point.name, point.city, point.street, point.owner?.full_name, point.owner?.phone, point.owner?.email]
      .filter(Boolean)
      .join(" "),
  );
}

/**
 * La clé a-t-elle été refusée par Google ? Il le signale par `gm_authFailure`,
 * fonction globale qu'il appelle sans autre moyen d'écoute, et remplace sinon
 * la carte par un avis en anglais qui ne dit pas quoi faire.
 */
function useKeyRefused(): boolean {
  const [refused, setRefused] = useState(false);
  useEffect(() => {
    const target = window as typeof window & { gm_authFailure?: () => void };
    target.gm_authFailure = () => setRefused(true);
    return () => {
      delete target.gm_authFailure;
    };
  }, []);
  return refused;
}

/**
 * Thème de la carte, calqué sur celui du backoffice : `data-theme` sur
 * `<html>` quand l'administrateur en a choisi un, le système sinon.
 */
function useColorScheme(): ColorScheme {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => observer.disconnect();
    },
    () => {
      const theme = document.documentElement.dataset.theme;
      return theme === "dark" ? ColorScheme.DARK : theme === "light" ? ColorScheme.LIGHT : ColorScheme.FOLLOW_SYSTEM;
    },
    () => ColorScheme.FOLLOW_SYSTEM,
  );
}
