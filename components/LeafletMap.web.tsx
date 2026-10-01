import React, { useEffect, useRef } from 'react';
import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LatLng } from '../lib/geo';
import type { Destination } from '../lib/types';
import { useApp } from '../context/AppContext';

type Props = {
  userPos: LatLng | null;
  destination: Destination | null;
  radius: number;
  tracking: boolean;
  followUser: boolean;
  recenterToken: number;
  onMapPress: (p: LatLng) => void;
};

const MAP_ID = 'arrivalert-leaflet';

function ensureLeafletCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('leaflet-css')) return;
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  const style = document.createElement('style');
  style.id = 'arrivalert-leaflet-overrides';
  style.textContent = `
    #${MAP_ID} { width: 100%; height: 100%; background: #070B12; }
    #${MAP_ID} .leaflet-container { background: #070B12; font-family: inherit; }
    #${MAP_ID} .leaflet-control-attribution {
      background: rgba(7,11,18,0.55) !important;
      color: #8B95A8 !important;
      font-size: 10px !important;
      backdrop-filter: blur(8px);
    }
    #${MAP_ID} .leaflet-control-attribution a { color: #3DDC97 !important; }
    #${MAP_ID} .leaflet-control-zoom { display: none; }
    .arriva-pin { background: transparent; border: none; }
    .arriva-user { background: transparent; border: none; }
    .user-dot {
      width: 18px; height: 18px; border-radius: 50%;
      background: #5B8CFF;
      border: 3px solid #fff;
      box-shadow: 0 0 0 8px rgba(91,140,255,0.28), 0 4px 12px rgba(0,0,0,0.4);
    }
    .dest-pin {
      width: 28px; height: 42px; position: relative;
      filter: drop-shadow(0 6px 8px rgba(0,0,0,0.45));
    }
    .dest-pin .head {
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: #FF4D6A; transform: rotate(-45deg);
      border: 3px solid #fff;
    }
    .dest-pin .pulse {
      position: absolute; left: 4px; top: 32px; width: 20px; height: 6px;
      background: rgba(255,77,106,0.35); border-radius: 50%;
    }
  `;
  document.head.appendChild(style);
}

export default function LeafletMap({
  userPos,
  destination,
  radius,
  tracking,
  followUser,
  recenterToken,
  onMapPress,
}: Props) {
  const { colors, isDark } = useApp();
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const lineRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const onPressRef = useRef(onMapPress);
  onPressRef.current = onMapPress;
  const followRef = useRef(followUser);
  followRef.current = followUser;
  const readyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    ensureLeafletCss();

    (async () => {
      const mod: any = await import('leaflet');
      const L = mod.default ?? mod;
      if (cancelled) return;
      LRef.current = L;

      const el = document.getElementById(MAP_ID);
      if (!el) return;
      if (mapRef.current) return;

      const start = userPos || { lat: 48.8566, lng: 2.3522 };
      const map = L.map(el, {
        zoomControl: false,
        attributionControl: true,
        zoom: 14,
        center: [start.lat, start.lng],
      });

      const tiles = isDark
        ? L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            {
              attribution:
                '&copy; OpenStreetMap &copy; CARTO',
              subdomains: 'abcd',
              maxZoom: 20,
            }
          )
        : L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            {
              attribution: '&copy; OpenStreetMap &copy; CARTO',
              subdomains: 'abcd',
              maxZoom: 20,
            }
          );
      tiles.addTo(map);

      map.on('click', (e: any) => {
        onPressRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      map.on('dragstart', () => {
        /* l'utilisateur explore : on ne recentre plus jusqu'au bouton */
      });

      mapRef.current = map;
      readyRef.current = true;
      setTimeout(() => map.invalidateSize(), 80);
      setTimeout(() => map.invalidateSize(), 400);
    })();

    return () => {
      cancelled = true;
      readyRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      userMarkerRef.current = null;
      destMarkerRef.current = null;
      radiusCircleRef.current = null;
      lineRef.current = null;
    };
    // init once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retile when theme changes
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    const url = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);
    const container = map.getContainer();
    container.style.background = isDark ? '#070B12' : '#EEF1F6';
  }, [isDark]);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !userPos) return;

    const latlng: [number, number] = [userPos.lat, userPos.lng];
    if (!userMarkerRef.current) {
      const icon = L.divIcon({
        className: 'arriva-user',
        html: '<div class="user-dot"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      userMarkerRef.current = L.marker(latlng, { icon, zIndexOffset: 600 }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(latlng);
    }

    if (followRef.current) {
      map.panTo(latlng, { animate: true, duration: 0.4 });
    }
  }, [userPos]);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    if (!destination) {
      if (destMarkerRef.current) {
        map.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }
      if (radiusCircleRef.current) {
        map.removeLayer(radiusCircleRef.current);
        radiusCircleRef.current = null;
      }
      if (lineRef.current) {
        map.removeLayer(lineRef.current);
        lineRef.current = null;
      }
      return;
    }

    const latlng: [number, number] = [destination.lat, destination.lng];
    if (!destMarkerRef.current) {
      const icon = L.divIcon({
        className: 'arriva-pin',
        html: '<div class="dest-pin"><div class="head"></div><div class="pulse"></div></div>',
        iconSize: [28, 42],
        iconAnchor: [14, 38],
      });
      destMarkerRef.current = L.marker(latlng, { icon, zIndexOffset: 700 }).addTo(map);
    } else {
      destMarkerRef.current.setLatLng(latlng);
    }

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = L.circle(latlng, {
        radius,
        color: '#3DDC97',
        weight: 2,
        fillColor: '#3DDC97',
        fillOpacity: tracking ? 0.18 : 0.1,
      }).addTo(map);
    } else {
      radiusCircleRef.current.setLatLng(latlng);
      radiusCircleRef.current.setRadius(radius);
      radiusCircleRef.current.setStyle({ fillOpacity: tracking ? 0.18 : 0.1 });
    }

    if (userPos) {
      const pts: [number, number][] = [
        [userPos.lat, userPos.lng],
        [destination.lat, destination.lng],
      ];
      if (!lineRef.current) {
        lineRef.current = L.polyline(pts, {
          color: '#5B8CFF',
          weight: 3,
          dashArray: '8 8',
          opacity: 0.85,
        }).addTo(map);
      } else {
        lineRef.current.setLatLngs(pts);
      }
    }
  }, [destination, radius, tracking, userPos]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const target = userPos || destination;
    if (!target) return;
    map.setView([target.lat, target.lng], Math.max(map.getZoom(), 14), {
      animate: true,
    });
    setTimeout(() => map.invalidateSize(), 50);
  }, [recenterToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !destination || !userPos) return;
    if (tracking) {
      try {
        map.fitBounds(
          [
            [userPos.lat, userPos.lng],
            [destination.lat, destination.lng],
          ],
          { padding: [80, 80, 220, 80], maxZoom: 16, animate: true }
        );
      } catch {
        /* ignore */
      }
    }
  }, [tracking]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]} pointerEvents="auto">
      {createElement('div', {
        id: MAP_ID,
        style: {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
});
