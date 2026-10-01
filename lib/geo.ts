/**
 * Utilitaires GPS — formule de Haversine et calculs géodésiques.
 * Tout est calculé côté client, sans backend.
 */

export type LatLng = {
  lat: number;
  lng: number;
};

/** Rayon moyen de la Terre en mètres (sphère WGS84 approximée). */
export const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Distance à vol d'oiseau entre deux points GPS, en mètres.
 * Formule de Haversine : précise à quelques mètres près pour du transport urbain.
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  // Clamp pour éviter les NaN dus aux erreurs d'arrondi (asin hors [-1, 1]).
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Cap initial (0–360°, 0 = Nord) pour aller de `from` vers `to`.
 * Utilisé par la boussole / le radar.
 */
export function bearing(from: LatLng, to: LatLng): number {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Point d'arrivée à `distanceM` mètres de `start` dans la direction `bearingDeg`.
 * Sert au mode démo (simulation du déplacement).
 */
export function destinationPoint(
  start: LatLng,
  distanceM: number,
  bearingDeg: number
): LatLng {
  const δ = distanceM / EARTH_RADIUS_M;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(start.lat);
  const λ1 = toRad(start.lng);
  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);

  const φ2 = Math.asin(sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ));
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * sinδ * cosφ1, cosδ - sinφ1 * Math.sin(φ2));

  return {
    lat: toDeg(φ2),
    lng: ((toDeg(λ2) + 540) % 360) - 180,
  };
}

/** Déplace `from` d'une fraction vers `to` (interpolation linéaire lat/lng). */
export function moveTowards(from: LatLng, to: LatLng, stepM: number): LatLng {
  const dist = haversineDistance(from, to);
  if (dist <= stepM || dist === 0) return { ...to };
  return destinationPoint(from, stepM, bearing(from, to));
}

/** Affichage humain : 342 m ou 1,24 km. */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const digits = km < 10 ? 2 : 1;
  return `${km.toFixed(digits).replace('.', ',')} km`;
}

/**
 * Estimation du temps d'arrivée.
 * Utilise la vitesse GPS si elle est fiable, sinon ~30 km/h (transport urbain).
 */
export function formatEta(distanceM: number, speedMps: number | null): string {
  if (!Number.isFinite(distanceM)) return '—';
  const speed =
    speedMps !== null && speedMps > 0.7 ? speedMps : 8.33; /* 30 km/h */
  const sec = Math.max(0, distanceM / speed);
  if (sec < 45) return '< 1 min';
  if (sec < 3600) return `${Math.round(sec / 60)} min`;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null || !Number.isFinite(accuracy)) return 'GPS';
  return `±${Math.round(accuracy)} m`;
}

export function compassLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const i = Math.round(deg / 45) % 8;
  return dirs[i];
}
