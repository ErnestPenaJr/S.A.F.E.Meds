/**
 * Pharmacy lookup. Uses the free OpenStreetMap Overpass API (no key, CORS-ok)
 * to find real nearby pharmacies; falls back to a small sample set if Overpass
 * is unavailable so the UI always works. No external API keys required.
 */
export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export const kmToMiles = (km) => km * 0.621371;

// Sensible default if the user blocks geolocation.
export const DEFAULT_LOCATION = { lat: 29.7604, lng: -95.3698, label: 'Houston, TX' };

const OVERPASS = 'https://overpass-api.de/api/interpreter';

function demoPharmacies(lat, lng) {
  const names = [
    'Community Pharmacy', 'Health Mart', 'MainStreet Drug',
    'CarePoint Rx', 'Wellness Pharmacy', 'Corner Drugstore'
  ];
  return names
    .map((name, i) => {
      const dLat = lat + (i % 2 ? 1 : -1) * 0.004 * (i + 1);
      const dLng = lng + ((i + 1) % 2 ? 1 : -1) * 0.005 * (i + 1);
      return {
        id: `demo-${i}`,
        name,
        address: `${100 + i * 40} Main St`,
        city: '', state: '', zip: '',
        phone: `(555) 01${i}-20${i}${i}`,
        latitude: dLat,
        longitude: dLng,
        distanceKm: haversineKm({ lat, lng }, { lat: dLat, lng: dLng })
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function findNearbyPharmacies(lat, lng) {
  const query =
    `[out:json][timeout:20];(` +
    `node["amenity"="pharmacy"](around:6000,${lat},${lng});` +
    `way["amenity"="pharmacy"](around:6000,${lat},${lng});` +
    `);out center 25;`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`overpass ${res.status}`);

    const json = await res.json();
    const results = (json.elements || [])
      .map((el) => {
        const plat = el.lat ?? el.center?.lat;
        const plng = el.lon ?? el.center?.lon;
        if (plat == null || plng == null) return null;
        const t = el.tags || {};
        const address =
          [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ') ||
          t['addr:full'] || '';
        return {
          id: `osm-${el.type}-${el.id}`,
          name: t.name || t.brand || 'Pharmacy',
          address,
          city: t['addr:city'] || '',
          state: t['addr:state'] || '',
          zip: t['addr:postcode'] || '',
          phone: t.phone || t['contact:phone'] || '',
          latitude: plat,
          longitude: plng,
          distanceKm: haversineKm({ lat, lng }, { lat: plat, lng: plng })
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    if (results.length) return { results: results.slice(0, 20), demo: false };
    throw new Error('no results');
  } catch {
    return { results: demoPharmacies(lat, lng), demo: true };
  }
}
