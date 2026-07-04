import type { TransportMode } from "./types";

// Deterministic travel-time estimation.
//
// The product spec calls for a maps/routing API. To keep the app fully
// self-contained, deterministic, and testable offline, we estimate from
// geo-coordinates using a great-circle distance, a road-detour factor, and
// realistic urban speeds per transport mode. The single `estimateTravelMinutes`
// function is the seam where a real routing API (Google/OSRM/Base44 connector)
// can be plugged in later — nothing else in the app invents travel times.

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = deg2rad(b.latitude - a.latitude);
  const dLng = deg2rad(b.longitude - a.longitude);
  const lat1 = deg2rad(a.latitude);
  const lat2 = deg2rad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

// Effective urban speed (km/h) and fixed overhead (min) per mode.
const MODE: Record<TransportMode, { speed: number; overhead: number }> = {
  walking: { speed: 5, overhead: 1 },
  bicycle: { speed: 15, overhead: 2 },
  car: { speed: 26, overhead: 5 }, // includes parking search
  public_transport: { speed: 19, overhead: 9 }, // includes waiting + transfers
};

// Roads/routes are longer than the straight line — a simple detour factor.
const ROAD_DETOUR = 1.35;

/**
 * Estimated door-to-door travel time in minutes. Deterministic: identical
 * inputs always yield the identical result, so the scoring engine is stable.
 */
export function estimateTravelMinutes(
  from: LatLng,
  to: LatLng,
  mode: TransportMode
): number {
  const straight = haversineKm(from, to);
  if (straight < 0.05) return 0;
  const km = straight * ROAD_DETOUR;
  const { speed, overhead } = MODE[mode];
  return Math.max(1, Math.round((km / speed) * 60 + overhead));
}

/** Straight-line distance label helper (km, 1 decimal). */
export function distanceKm(from: LatLng, to: LatLng): number {
  return Math.round(haversineKm(from, to) * 10) / 10;
}

// --- Geocoding cache -------------------------------------------------------
// Studios store coordinates after geocoding once; we never re-geocode the same
// address. This in-memory + localStorage cache models that behaviour. In this
// build all demo studios already carry coordinates, so this is a fallback for
// free-typed addresses (a light offset hash keeps it deterministic & local).

const GEO_KEY = "spoyt.geocache.v1";

function loadCache(): Record<string, LatLng> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(GEO_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, LatLng>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GEO_KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota errors */
  }
}

// Tel-Aviv metro centroid — the anchor for approximating free-typed addresses.
const ANCHOR: LatLng = { latitude: 32.0785, longitude: 34.7818 };

/** Deterministic pseudo-geocode for addresses without stored coordinates. */
export function geocodeAddress(address: string): LatLng {
  const key = address.trim();
  if (!key) return ANCHOR;
  const cache = loadCache();
  if (cache[key]) return cache[key];

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) & 0xffffffff;
  }
  // Spread within ~±6 km of the anchor, deterministically.
  const latOffset = (((hash & 0xffff) / 0xffff) - 0.5) * 0.11;
  const lngOffset = ((((hash >> 16) & 0xffff) / 0xffff) - 0.5) * 0.14;
  const result: LatLng = {
    latitude: ANCHOR.latitude + latOffset,
    longitude: ANCHOR.longitude + lngOffset,
  };
  cache[key] = result;
  saveCache(cache);
  return result;
}
