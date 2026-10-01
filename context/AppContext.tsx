import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  formatDistance,
  haversineDistance,
  moveTowards,
  type LatLng,
} from '../lib/geo';
import {
  startAlarm,
  startVibrate,
  stopAllAlerts,
  unlockAudio,
} from '../lib/audio';
import {
  clearWatch,
  getCurrentPosition,
  watchPosition,
  type GeoError,
} from '../lib/geolocation';
import { reverseGeocode } from '../lib/nominatim';
import {
  darkPalette,
  lightPalette,
  type Palette,
  type ThemePreference,
} from '../lib/theme';
import type { Destination, SavedPlace } from '../lib/types';

const PARIS_CENTER: LatLng = { lat: 48.8566, lng: 2.3522 };
const SNOOZE_MS = 60_000;
const DEMO_TICK_MS = 450;
/** ~56 km/h simulé (7 m / 0,45 s) — rythme bus / RER. */
const DEMO_METERS = 7;

type AppContextValue = {
  colors: Palette;
  isDark: boolean;
  themePref: ThemePreference;
  setThemePref: (p: ThemePreference) => void;

  userPos: LatLng | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  geoError: string | null;
  locating: boolean;

  destination: Destination | null;
  radius: number;
  setRadius: (n: number) => void;
  setDestination: (d: Destination | null) => void;
  dropPin: (point: LatLng) => void;

  tracking: boolean;
  alerting: boolean;
  distance: number | null;
  remainingLabel: string;

  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  vibrateEnabled: boolean;
  setVibrateEnabled: (v: boolean) => void;
  followUser: boolean;
  setFollowUser: (v: boolean) => void;

  demoMode: boolean;
  setDemoMode: (v: boolean) => void;

  places: SavedPlace[];
  saveCurrentDestination: () => void;
  removePlace: (id: string) => void;
  usePlace: (place: SavedPlace) => void;

  startTracking: () => Promise<void>;
  stopTracking: () => void;
  stopAlert: () => void;
  snoozeAlert: () => void;
  previewAlert: () => void;
  recenterToken: number;
  requestRecenter: () => void;
  refreshLocation: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [themePref, setThemePref] = useState<ThemePreference>('dark');
  const isDark =
    themePref === 'auto' ? system !== 'light' : themePref === 'dark';
  const colors = isDark ? darkPalette : lightPalette;

  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);

  const [destination, setDestination] = useState<Destination | null>(null);
  const [radius, setRadius] = useState(500);
  const [tracking, setTracking] = useState(false);
  const [alerting, setAlerting] = useState(false);
  const [snoozedUntil, setSnoozedUntil] = useState(0);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [followUser, setFollowUser] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const [places, setPlaces] = useState<SavedPlace[]>([
    {
      id: 'fav-gdl',
      name: 'Gare de Lyon',
      address: 'Paris, France',
      lat: 48.8443,
      lng: 2.3739,
      savedAt: Date.now() - 86_400_000,
    },
    {
      id: 'fav-cdn',
      name: 'Châtelet – Les Halles',
      address: 'Paris, France',
      lat: 48.8616,
      lng: 2.347,
      savedAt: Date.now() - 72_000_000,
    },
    {
      id: 'fav-cdg',
      name: 'Aéroport CDG, Terminal 2',
      address: 'Roissy-en-France',
      lat: 49.0097,
      lng: 2.5479,
      savedAt: Date.now() - 50_000_000,
    },
  ]);

  const [recenterToken, setRecenterToken] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const destRef = useRef(destination);
  destRef.current = destination;
  const trackingRef = useRef(tracking);
  trackingRef.current = tracking;
  const alertingRef = useRef(alerting);
  alertingRef.current = alerting;
  const radiusRef = useRef(radius);
  radiusRef.current = radius;
  const snoozeRef = useRef(snoozedUntil);
  snoozeRef.current = snoozedUntil;

  const distance =
    userPos && destination ? haversineDistance(userPos, destination) : null;
  const remainingLabel = distance === null ? '—' : formatDistance(distance);

  const applyFix = useCallback((fix: {
    lat: number;
    lng: number;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
  }) => {
    setUserPos({ lat: fix.lat, lng: fix.lng });
    if (fix.accuracy !== undefined) setAccuracy(fix.accuracy ?? null);
    if (fix.speed !== undefined) setSpeed(fix.speed ?? null);
    if (fix.heading !== undefined) setHeading(fix.heading ?? null);
  }, []);

  const maybeAlert = useCallback((pos: LatLng) => {
    const dest = destRef.current;
    if (!trackingRef.current || alertingRef.current || !dest) return;
    const d = haversineDistance(pos, dest);
    if (d <= radiusRef.current && Date.now() >= snoozeRef.current) {
      setAlerting(true);
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    setLocating(true);
    try {
      const fix = await getCurrentPosition();
      applyFix(fix);
      setGeoError(null);
      setDemoMode(false);
    } catch (e) {
      const msg = (e as GeoError)?.message || 'GPS indisponible';
      setGeoError(msg);
      setUserPos((prev) => prev ?? PARIS_CENTER);
      setDemoMode(true);
    } finally {
      setLocating(false);
    }
  }, [applyFix]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fix = await getCurrentPosition();
        if (cancelled) return;
        applyFix(fix);
        setGeoError(null);
      } catch (e) {
        if (cancelled) return;
        setGeoError((e as GeoError)?.message || 'GPS indisponible');
        setUserPos(PARIS_CENTER);
        setDemoMode(true);
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyFix]);

  useEffect(() => {
    if (!alerting) {
      stopAllAlerts();
      return;
    }
    if (soundEnabled) startAlarm();
    if (vibrateEnabled) startVibrate();
    return () => stopAllAlerts();
  }, [alerting, soundEnabled, vibrateEnabled]);

  const stopDemoLoop = useCallback(() => {
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  }, []);

  const stopTracking = useCallback(() => {
    trackingRef.current = false;
    setTracking(false);
    setAlerting(false);
    alertingRef.current = false;
    stopDemoLoop();
    clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    stopAllAlerts();
  }, [stopDemoLoop]);

  const startTracking = useCallback(async () => {
    if (!destRef.current) return;
    await unlockAudio();
    setSnoozedUntil(0);
    snoozeRef.current = 0;
    setAlerting(false);
    alertingRef.current = false;
    trackingRef.current = true;
    setTracking(true);

    stopDemoLoop();
    clearWatch(watchIdRef.current);
    watchIdRef.current = null;

    if (demoMode) {
      demoTimerRef.current = setInterval(() => {
        setUserPos((prev) => {
          const dest = destRef.current;
          if (!prev || !dest) return prev;
          const next = moveTowards(prev, dest, DEMO_METERS);
          maybeAlert(next);
          return next;
        });
        setSpeed(7);
      }, DEMO_TICK_MS);
      return;
    }

    watchIdRef.current = watchPosition(
      (fix) => {
        applyFix(fix);
        maybeAlert(fix);
      },
      (err) => {
        setGeoError(err.message);
      }
    );
  }, [applyFix, demoMode, maybeAlert, stopDemoLoop]);

  useEffect(() => {
    return () => {
      stopDemoLoop();
      clearWatch(watchIdRef.current);
      stopAllAlerts();
    };
  }, [stopDemoLoop]);

  const dropPin = useCallback(async (point: LatLng) => {
    const fallback: Destination = {
      ...point,
      name: 'Destination',
      address: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
    };
    setDestination(fallback);
    try {
      const rev = await reverseGeocode(point);
      setDestination((prev) => {
        if (!prev || prev.lat !== point.lat || prev.lng !== point.lng) return prev;
        return { ...point, name: rev.name, address: rev.address };
      });
    } catch {
      /* keep fallback */
    }
  }, []);

  const addPlace = useCallback((place: Omit<SavedPlace, 'id' | 'savedAt'> & { id?: string }) => {
    setPlaces((prev) => {
      const exists = prev.find(
        (p) => haversineDistance(p, place) < 40
      );
      if (exists) {
        return [
          { ...exists, name: place.name, address: place.address, savedAt: Date.now() },
          ...prev.filter((p) => p.id !== exists.id),
        ];
      }
      const next: SavedPlace = {
        ...place,
        id: place.id || uid(),
        savedAt: Date.now(),
      };
      return [next, ...prev].slice(0, 24);
    });
  }, []);

  const saveCurrentDestination = useCallback(() => {
    if (!destination) return;
    addPlace(destination);
  }, [addPlace, destination]);

  const removePlace = useCallback((id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const usePlace = useCallback((place: SavedPlace) => {
    setDestination({
      lat: place.lat,
      lng: place.lng,
      name: place.name,
      address: place.address,
    });
  }, []);

  const stopAlert = useCallback(() => {
    stopTracking();
  }, [stopTracking]);

  const snoozeAlert = useCallback(() => {
    const until = Date.now() + SNOOZE_MS;
    setSnoozedUntil(until);
    snoozeRef.current = until;
    setAlerting(false);
    alertingRef.current = false;
    stopAllAlerts();
  }, []);

  const previewAlert = useCallback(async () => {
    await unlockAudio();
    setAlerting(true);
    alertingRef.current = true;
  }, []);

  const requestRecenter = useCallback(() => {
    setRecenterToken((n) => n + 1);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      colors,
      isDark,
      themePref,
      setThemePref,
      userPos,
      accuracy,
      speed,
      heading,
      geoError,
      locating,
      destination,
      radius,
      setRadius,
      setDestination,
      dropPin,
      tracking,
      alerting,
      distance,
      remainingLabel,
      soundEnabled,
      setSoundEnabled,
      vibrateEnabled,
      setVibrateEnabled,
      followUser,
      setFollowUser,
      demoMode,
      setDemoMode,
      places,
      saveCurrentDestination,
      removePlace,
      usePlace,
      startTracking,
      stopTracking,
      stopAlert,
      snoozeAlert,
      previewAlert,
      recenterToken,
      requestRecenter,
      refreshLocation,
    }),
    [
      accuracy,
      alerting,
      colors,
      demoMode,
      destination,
      distance,
      dropPin,
      followUser,
      geoError,
      heading,
      isDark,
      locating,
      places,
      previewAlert,
      radius,
      recenterToken,
      remainingLabel,
      requestRecenter,
      saveCurrentDestination,
      snoozeAlert,
      soundEnabled,
      speed,
      startTracking,
      stopAlert,
      stopTracking,
      themePref,
      tracking,
      usePlace,
      userPos,
      vibrateEnabled,
      refreshLocation,
      removePlace,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
