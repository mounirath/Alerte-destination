import type { LatLng } from './geo';

export type SearchHit = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Accept-Language': 'fr',
};

function displayNameParts(display: string): { name: string; address: string } {
  const parts = display.split(',').map((p) => p.trim()).filter(Boolean);
  return {
    name: parts[0] || display,
    address: parts.slice(1, 4).join(', ') || display,
  };
}

/** Recherche d'adresses via Nominatim (OpenStreetMap), sans clé API. */
export async function searchPlaces(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=` +
    encodeURIComponent(q);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error('Recherche indisponible');
  const data = (await res.json()) as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    name?: string;
  }>;
  return data.map((item) => {
    const parts = displayNameParts(item.display_name);
    return {
      id: String(item.place_id),
      name: item.name || parts.name,
      address: parts.address,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
  });
}

/** Inverse : coordonnées → nom de lieu. */
export async function reverseGeocode(point: LatLng): Promise<{ name: string; address: string }> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}&zoom=18&addressdetails=1`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    return {
      name: 'Destination',
      address: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
    };
  }
  const data = (await res.json()) as {
    display_name?: string;
    name?: string;
    address?: Record<string, string>;
  };
  const parts = displayNameParts(data.display_name || '');
  const road =
    data.address?.road ||
    data.address?.pedestrian ||
    data.address?.neighbourhood;
  const city =
    data.address?.city ||
    data.address?.town ||
    data.address?.village ||
    data.address?.municipality;
  return {
    name: data.name || road || parts.name || 'Destination',
    address: [road, city].filter(Boolean).join(', ') || parts.address,
  };
}
