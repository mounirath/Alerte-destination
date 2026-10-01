import type { LatLng } from './geo';

export type GeoFix = LatLng & {
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
};

export type GeoError = {
  code: number;
  message: string;
};

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 1000,
  timeout: 12000,
};

function toFix(pos: GeolocationPosition): GeoFix {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? null,
    speed: pos.coords.speed ?? null,
    heading: pos.coords.heading ?? null,
  };
}

function mapError(err: GeolocationPositionError | unknown): GeoError {
  if (err && typeof err === 'object' && 'code' in err) {
    const e = err as GeolocationPositionError;
    const messages: Record<number, string> = {
      1: 'Permission de localisation refusée. Autorisez le GPS ou activez le mode démo.',
      2: 'Position indisponible. Vérifiez le GPS ou le réseau.',
      3: 'Délai dépassé pour obtenir la position.',
    };
    return { code: e.code, message: messages[e.code] || e.message || 'Erreur GPS' };
  }
  return { code: 0, message: 'Géolocalisation indisponible sur cet appareil.' };
}

export function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.geolocation;
}

export function getCurrentPosition(): Promise<GeoFix> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(mapError(null));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(toFix(pos)),
      (err) => reject(mapError(err)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });
}

export function watchPosition(
  onFix: (fix: GeoFix) => void,
  onError?: (err: GeoError) => void
): number | null {
  if (!isGeolocationAvailable()) {
    onError?.(mapError(null));
    return null;
  }
  return navigator.geolocation.watchPosition(
    (pos) => onFix(toFix(pos)),
    (err) => onError?.(mapError(err)),
    WATCH_OPTIONS
  );
}

export function clearWatch(id: number | null) {
  if (id !== null && isGeolocationAvailable()) {
    navigator.geolocation.clearWatch(id);
  }
}
