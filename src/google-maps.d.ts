// Types de l'espace de noms global `google.maps`, utilisé par la carte des
// résidences (`platform-map.tsx`) et par `@googlemaps/markerclusterer`, dont
// `MarkerClusterer` hérite de `google.maps.OverlayView` — `setMap` compris.
// Déclarés ici plutôt que laissés à l'inclusion automatique des `@types` :
// arrivés seulement en dépendance de `@vis.gl/react-google-maps`, l'éditeur
// ne les voyait pas toujours.
/// <reference types="google.maps" />
