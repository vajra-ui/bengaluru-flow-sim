// Real geocoding (Nominatim) and routing (OSRM) service for Tamil Nadu

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
  displayName: string;
}

export interface RouteResult {
  path: [number, number][]; // [lat, lng][]
  distance: number; // km
  duration: number; // minutes
  summary: string;
}

// Geocode a place name using Nominatim (OpenStreetMap) — restricted to Tamil Nadu
export async function geocodeLocation(query: string): Promise<GeoLocation[]> {
  if (query.trim().length < 2) return [];

  try {
    const params = new URLSearchParams({
      q: `${query}, Tamil Nadu, India`,
      format: 'json',
      limit: '6',
      countrycodes: 'in',
      viewbox: '76.0,8.0,80.5,13.5', // Tamil Nadu bounding box
      bounded: '1',
    });

    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'TNTrafficIntel/1.0' },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name.split(',')[0],
      displayName: item.display_name.split(',').slice(0, 3).join(', '),
    }));
  } catch {
    return [];
  }
}

// Get real route between two points using OSRM
export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]] as [number, number] // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
    );

    return {
      path: coords,
      distance: Math.round(route.distance / 100) / 10, // meters to km
      duration: Math.round(route.duration / 60), // seconds to minutes
      summary: route.legs?.[0]?.summary || 'Route',
    };
  } catch {
    return null;
  }
}

// Get multiple route alternatives
export async function getRouteAlternatives(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&alternatives=3&steps=true`;
    const res = await fetch(url);

    if (!res.ok) return [];

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes) return [];

    return data.routes.map((route: any) => ({
      path: route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as [number, number]
      ),
      distance: Math.round(route.distance / 100) / 10,
      duration: Math.round(route.duration / 60),
      summary: route.legs?.[0]?.summary || 'Route',
    }));
  } catch {
    return [];
  }
}

// Generate a mock safety score for a real route based on time-of-day and distance
export function generateRouteSafetyScore(route: RouteResult): number {
  const hour = new Date().getHours();
  let baseScore = 70;

  // Late night is riskier
  if (hour >= 22 || hour < 5) baseScore -= 20;
  else if (hour >= 19) baseScore -= 10;
  else if (hour >= 8 && hour <= 10) baseScore += 5;

  // Longer routes slightly riskier
  if (route.distance > 100) baseScore -= 10;
  else if (route.distance > 50) baseScore -= 5;
  else if (route.distance < 10) baseScore += 5;

  // Add some randomness for variation
  baseScore += Math.floor(Math.random() * 15) - 5;

  return Math.max(20, Math.min(95, baseScore));
}
