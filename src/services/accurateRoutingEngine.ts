import { CalendarEvent, RouteOption, TransportMode, TrafficStatus, RouteStep, TransitPreference } from '../types.js';

interface LatLng {
  lat: number;
  lng: number;
  displayName?: string;
}

// Preset Dictionary of Known Global Cities & Landmarks for Instant Resolution
const PRESET_LOCATIONS: Record<string, LatLng> = {
  // San Francisco Bay Area
  'san francisco': { lat: 37.7749, lng: -122.4194, displayName: 'San Francisco, CA' },
  'sf': { lat: 37.7749, lng: -122.4194, displayName: 'San Francisco, CA' },
  'salesforce tower': { lat: 37.7897, lng: -122.3972, displayName: 'Salesforce Tower, San Francisco, CA' },
  'sfo': { lat: 37.6213, lng: -122.3790, displayName: 'San Francisco International Airport (SFO)' },
  'san francisco airport': { lat: 37.6213, lng: -122.3790, displayName: 'San Francisco International Airport (SFO)' },
  'oakland': { lat: 37.8044, lng: -122.2712, displayName: 'Oakland, CA' },
  'san jose': { lat: 37.3382, lng: -121.8863, displayName: 'San Jose, CA' },
  'palo alto': { lat: 37.4419, lng: -122.1430, displayName: 'Palo Alto, CA' },
  'mountain view': { lat: 37.3861, lng: -122.0839, displayName: 'Mountain View, CA' },
  'berkeley': { lat: 37.8715, lng: -122.2730, displayName: 'Berkeley, CA' },
  'ferry building': { lat: 37.7955, lng: -122.3937, displayName: 'Ferry Building, San Francisco, CA' },
  'golden gate bridge': { lat: 37.8199, lng: -122.4783, displayName: 'Golden Gate Bridge, SF' },
  'uc berkeley': { lat: 37.8719, lng: -122.2585, displayName: 'UC Berkeley Campus, CA' },
  'stanford': { lat: 37.4275, lng: -122.1697, displayName: 'Stanford University, Stanford, CA' },

  // London & UK
  'london': { lat: 51.5074, lng: -0.1278, displayName: 'London, UK' },
  'london, uk': { lat: 51.5074, lng: -0.1278, displayName: 'London, UK' },
  'canary wharf': { lat: 51.5054, lng: -0.0275, displayName: 'Canary Wharf, London, UK' },
  "king's cross": { lat: 51.5309, lng: -0.1233, displayName: "King's Cross Station, London, UK" },
  'kings cross': { lat: 51.5309, lng: -0.1233, displayName: "King's Cross Station, London, UK" },
  'st pancras': { lat: 51.5314, lng: -0.1261, displayName: 'St Pancras International, London' },
  'the shard': { lat: 51.5045, lng: -0.0865, displayName: 'The Shard, London, UK' },
  'heathrow': { lat: 51.4700, lng: -0.4543, displayName: 'Heathrow Airport (LHR), London' },
  'westminster': { lat: 51.4975, lng: -0.1357, displayName: 'Westminster, London, UK' },
  'manchester': { lat: 53.4808, lng: -2.2426, displayName: 'Manchester, UK' },
  'birmingham': { lat: 52.4862, lng: -1.8904, displayName: 'Birmingham, UK' },
  'edinburgh': { lat: 55.9533, lng: -3.1883, displayName: 'Edinburgh, UK' },

  // New York & US East Coast
  'new york': { lat: 40.7128, lng: -74.0060, displayName: 'New York City, NY' },
  'nyc': { lat: 40.7128, lng: -74.0060, displayName: 'New York City, NY' },
  'manhattan': { lat: 40.7831, lng: -73.9712, displayName: 'Manhattan, NY' },
  'brooklyn': { lat: 40.6782, lng: -73.9442, displayName: 'Brooklyn, NY' },
  'jfk airport': { lat: 40.6413, lng: -73.7781, displayName: 'JFK Airport, NY' },
  'boston': { lat: 42.3601, lng: -71.0589, displayName: 'Boston, MA' },
  'washington dc': { lat: 38.9072, lng: -77.0369, displayName: 'Washington, D.C.' },
  'chicago': { lat: 41.8781, lng: -87.6298, displayName: 'Chicago, IL' },
  'los angeles': { lat: 34.0522, lng: -118.2437, displayName: 'Los Angeles, CA' },
  'seattle': { lat: 47.6062, lng: -122.3321, displayName: 'Seattle, WA' },

  // Europe & Global
  'paris': { lat: 48.8566, lng: 2.3522, displayName: 'Paris, France' },
  'tokyo': { lat: 35.6762, lng: 139.6503, displayName: 'Tokyo, Japan' },
  'berlin': { lat: 52.5200, lng: 13.4050, displayName: 'Berlin, Germany' },
  'sydney': { lat: -33.8688, lng: 151.2093, displayName: 'Sydney, Australia' },
  'toronto': { lat: 43.6532, lng: -79.3832, displayName: 'Toronto, Canada' },
  'dublin': { lat: 53.3498, lng: -6.2603, displayName: 'Dublin, Ireland' },
};

export function parseCoordsFromText(text: string): LatLng | null {
  if (!text) return null;
  const match = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, displayName: text };
    }
  }
  return null;
}

export async function geocodeLocation(query: string): Promise<LatLng> {
  const clean = (query || '').trim();
  if (!clean) {
    return { lat: 37.7749, lng: -122.4194, displayName: 'San Francisco, CA' };
  }

  // 1. Direct coordinate match (lat, lng)
  const parsed = parseCoordsFromText(clean);
  if (parsed) return parsed;

  // 2. Exact preset dictionary match ONLY
  const lower = clean.toLowerCase();
  for (const [key, coords] of Object.entries(PRESET_LOCATIONS)) {
    if (lower === key) {
      return coords;
    }
  }

  // 3. High-precision Geocoding via Photon Komoot API (supports postcodes, streets, landmarks)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=1`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && Array.isArray(data.features) && data.features.length > 0) {
        const feat = data.features[0];
        const coords = feat.geometry?.coordinates; // [lng, lat]
        if (coords && coords.length >= 2) {
          const lng = coords[0];
          const lat = coords[1];
          const props = feat.properties || {};
          const labelParts = [
            props.name || props.street,
            props.postcode,
            props.city || props.town || props.state,
            props.country,
          ].filter(Boolean);
          const displayName = labelParts.join(', ') || clean;

          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng, displayName };
          }
        }
      }
    }
  } catch (err) {
    console.warn(`Photon geocode skipped for "${clean}":`, err);
  }

  // 4. Nominatim OpenStreetMap Geocoding API Backup
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&limit=1&addressdetails=1`, {
      headers: { 'User-Agent': 'CommuteAssistant/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng, displayName: data[0].display_name || clean };
        }
      }
    }
  } catch (err) {
    console.warn(`Nominatim geocode skipped or timed out for "${clean}"`);
  }

  // 5. Check preset dictionary with strict word boundaries as backup
  for (const [key, coords] of Object.entries(PRESET_LOCATIONS)) {
    if (key.length > 2 && new RegExp(`\\b${key}\\b`, 'i').test(clean)) {
      return coords;
    }
  }

  // 6. Deterministic Hash Fallback based on text so unique locations produce realistic different points
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 100) - 50) * 0.006;
  const lngOffset = ((Math.abs(hash >> 3) % 100) - 50) * 0.006;

  return {
    lat: 37.7749 + latOffset,
    lng: -122.4194 + lngOffset,
    displayName: clean,
  };
}

export async function autocompleteLocations(query: string): Promise<import('../types.js').LocationSuggestion[]> {
  const clean = (query || '').trim();
  if (!clean || clean.length < 2) return [];

  const results: import('../types.js').LocationSuggestion[] = [];
  const seen = new Set<string>();

  // 1. Check PRESET_LOCATIONS
  const lower = clean.toLowerCase();
  for (const [key, coords] of Object.entries(PRESET_LOCATIONS)) {
    if (key.includes(lower) || lower.includes(key)) {
      const keyName = coords.displayName || key;
      if (!seen.has(keyName)) {
        seen.add(keyName);
        results.push({
          displayName: keyName,
          address: keyName,
          lat: coords.lat,
          lng: coords.lng,
          type: 'landmark',
        });
      }
    }
  }

  // 2. Photon Komoot Autocomplete (high accuracy for addresses, postcodes & places)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=6`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && Array.isArray(data.features)) {
        for (const feat of data.features) {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates; // [lng, lat]
          if (!coords || coords.length < 2) continue;

          const lat = coords[1];
          const lng = coords[0];

          const title = props.name || props.street || props.postcode || props.district || props.city || clean;

          const addressParts = [
            props.housenumber ? `${props.housenumber} ${props.street || ''}` : props.street,
            props.district || props.suburb,
            props.postcode,
            props.city || props.town || props.state,
            props.country,
          ].filter(Boolean);

          const fullAddress = addressParts.join(', ') || title;

          if (!seen.has(fullAddress)) {
            seen.add(fullAddress);
            let type: 'postcode' | 'landmark' | 'address' | 'city' = 'address';
            if (props.postcode && (clean.toLowerCase().includes(props.postcode.toLowerCase()) || props.postcode.toLowerCase().includes(clean.toLowerCase()))) {
              type = 'postcode';
            } else if (props.osm_value === 'city' || props.osm_value === 'town') {
              type = 'city';
            } else if (props.osm_key === 'tourism' || props.osm_key === 'amenity' || props.name) {
              type = 'landmark';
            }

            results.push({
              displayName: title,
              address: fullAddress,
              city: props.city || props.town,
              postcode: props.postcode,
              country: props.country,
              lat,
              lng,
              type,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Photon autocomplete error:', err);
  }

  // 3. Fallback Nominatim Search
  if (results.length === 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&limit=5&addressdetails=1`, {
        headers: { 'User-Agent': 'CommuteAssistant/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const addr = item.address || {};
            const postcode = addr.postcode;
            const fullAddress = item.display_name || clean;

            if (!isNaN(lat) && !isNaN(lng) && !seen.has(fullAddress)) {
              seen.add(fullAddress);
              results.push({
                displayName: item.name || addr.road || addr.postcode || fullAddress.split(',')[0],
                address: fullAddress,
                city: addr.city || addr.town || addr.village,
                postcode,
                country: addr.country,
                lat,
                lng,
                type: postcode && clean.toUpperCase().includes(postcode.toUpperCase()) ? 'postcode' : 'address',
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Nominatim fallback error:', e);
    }
  }

  return results.slice(0, 6);
}

export function calculateHaversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function fetchOSRMRoute(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  profile: 'driving' | 'bike' | 'foot' = 'driving'
): Promise<{ distanceKm: number; durationMinutes: number } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const url = `https://router.project-osrm.org/route/v1/${profile}/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));
        return { distanceKm, durationMinutes };
      }
    }
  } catch (e) {
    // Fail silently to use physics model fallback
  }
  return null;
}

export async function fetchGoogleMapsRoute(
  origin: string,
  destination: string,
  mode: TransportMode,
  transitPreference: TransitPreference = 'ANY',
  originCoordinates?: {lat:number;lng:number}
): Promise<{ distanceKm: number; durationMinutes: number; trafficDelayMinutes?: number; fare?: string; encodedPolyline?: string; steps: RouteStep[] } | null> {
  const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY;
  if (!apiKey) return null;

  const travelMode = { driving: 'DRIVE', transit: 'TRANSIT', bicycling: 'BICYCLE', walking: 'WALK' }[mode];
  try {
    const resp = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration,routes.staticDuration,routes.travelAdvisory.transitFare,routes.legs.steps',
      },
      body: JSON.stringify({
        origin: originCoordinates ? { location: { latLng: { latitude: originCoordinates.lat, longitude: originCoordinates.lng } } } : { address: origin },
        destination: { address: destination },
        travelMode,
        ...(mode === 'transit' && transitPreference !== 'ANY' ? { transitPreferences: { allowedTravelModes: [transitPreference] } } : {}),
        ...(mode === 'driving' ? { routingPreference: 'TRAFFIC_AWARE' } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) {
      console.warn(`Google Routes API returned HTTP ${resp.status}; using fallback routing.`);
      return null;
    }
    const data = await resp.json();
    const route = data.routes?.[0];
    if (!route) return null;
    const durationSec = Number.parseFloat(route.duration);
    const baseDurationSec = Number.parseFloat(route.staticDuration ?? route.duration);
    if (!Number.isFinite(route.distanceMeters) || route.distanceMeters < 0 ||
        !Number.isFinite(durationSec) || durationSec < 0 || !Number.isFinite(baseDurationSec)) return null;
    const money = route.travelAdvisory?.transitFare;
    let fare: string | undefined;
    if (money?.currencyCode) {
      const amount = Number(money.units ?? 0) + Number(money.nanos ?? 0) / 1e9;
      if (Number.isFinite(amount) && amount >= 0) {
        try { fare = new Intl.NumberFormat('en-GB', { style: 'currency', currency: money.currencyCode }).format(amount); } catch { /* Invalid provider currency: omit fare. */ }
      }
    }
    const steps: RouteStep[] = (route.legs ?? []).flatMap((leg: any) => (leg.steps ?? []).map((step: any): RouteStep => {
      const details = step.transitDetails;
      const stops = details?.stopDetails;
      const stepMode: TransportMode = ({ DRIVE: 'driving', WALK: 'walking', BICYCLE: 'bicycling', TRANSIT: 'transit' } as const)[step.travelMode as 'DRIVE'] ?? mode;
      const seconds = Number.parseFloat(step.staticDuration);
      return {
        instruction: step.navigationInstruction?.instructions || (details ? `Take ${details.transitLine?.nameShort || details.transitLine?.name || 'transit'}${details.headsign ? ` toward ${details.headsign}` : ''}` : 'Continue along route'),
        distance: Number.isFinite(step.distanceMeters) ? `${(step.distanceMeters / 1000).toFixed(1)} km` : '',
        duration: Number.isFinite(seconds) ? `${Math.ceil(seconds / 60)} min` : '',
        mode: stepMode,
        transitVehicleCode: details?.transitLine?.vehicle?.type,
        transitVehicle: details?.transitLine?.vehicle?.name?.text || details?.transitLine?.vehicle?.type,
        lineName: details?.transitLine?.nameShort || details?.transitLine?.name,
        departureStop: stops?.departureStop?.name,
        arrivalStop: stops?.arrivalStop?.name,
        departureTime: stops?.departureTime,
        arrivalTime: stops?.arrivalTime,
      };
    }));
    return {
      fare,
      encodedPolyline: route.polyline?.encodedPolyline,
      steps,
      distanceKm: Number((route.distanceMeters / 1000).toFixed(1)),
      durationMinutes: Math.max(1, Math.round(durationSec / 60)),
      trafficDelayMinutes: mode === 'driving' ? Math.max(0, Math.round((durationSec - baseDurationSec) / 60)) : 0,
    };
  } catch {
    console.warn('Google Routes API unavailable or timed out; using fallback routing.');
  }
  return null;
}

export async function computeAccurateRouteOptions(
  originAddress: string,
  event: CalendarEvent,
  buffers: Record<TransportMode, number>,
  transitPreference: TransitPreference = 'ANY',
  originCoordinates?: {lat:number;lng:number}
): Promise<Record<TransportMode, RouteOption>> {
  const eventStartTimeMs = new Date(event.startTime).getTime();
  const destAddress = event.parsedDestination || event.location;

  // 1. Geocode origin & destination in parallel to obtain precise coordinates
  const [originGeo, destGeo] = await Promise.all([
    originCoordinates ? Promise.resolve({...originCoordinates, displayName: originAddress}) : geocodeLocation(originAddress),
    geocodeLocation(destAddress),
  ]);

  // 2. Check if Google Maps API key is provided for exact routes
  const [gDriving, gTransit, gBike, gWalk] = await Promise.all([
    fetchGoogleMapsRoute(originAddress, destAddress, 'driving', 'ANY', originCoordinates),
    fetchGoogleMapsRoute(originAddress, destAddress, 'transit', transitPreference, originCoordinates),
    fetchGoogleMapsRoute(originAddress, destAddress, 'bicycling', 'ANY', originCoordinates),
    fetchGoogleMapsRoute(originAddress, destAddress, 'walking', 'ANY', originCoordinates),
  ]);

  // 3. Fetch OSRM real road routes for all modes in parallel if Google Maps is absent
  const [osrmDriving, osrmBike, osrmFoot] = await Promise.all([
    gDriving ? null : fetchOSRMRoute(originGeo.lat, originGeo.lng, destGeo.lat, destGeo.lng, 'driving'),
    gBike ? null : fetchOSRMRoute(originGeo.lat, originGeo.lng, destGeo.lat, destGeo.lng, 'bike'),
    gWalk ? null : fetchOSRMRoute(originGeo.lat, originGeo.lng, destGeo.lat, destGeo.lng, 'foot'),
  ]);

  // Straight line distance
  const straightLineKm = calculateHaversineDistanceKm(originGeo.lat, originGeo.lng, destGeo.lat, destGeo.lng);

  // Actual road distances (km)
  const actualDriveKm = gDriving?.distanceKm
    ? gDriving.distanceKm
    : osrmDriving
    ? Math.max(0.1, osrmDriving.distanceKm)
    : Math.max(0.1, parseFloat((straightLineKm * 1.28).toFixed(1)));

  const actualBikeKm = gBike?.distanceKm
    ? gBike.distanceKm
    : osrmBike
    ? Math.max(0.1, osrmBike.distanceKm)
    : Math.max(0.1, parseFloat((straightLineKm * 1.15).toFixed(1)));

  const actualWalkKm = gWalk?.distanceKm
    ? gWalk.distanceKm
    : osrmFoot
    ? Math.max(0.1, osrmFoot.distanceKm)
    : Math.max(0.1, parseFloat((straightLineKm * 1.08).toFixed(1)));

  // Currency & Region Context
  const combinedLoc = `${originAddress} ${destAddress} ${originGeo.displayName || ''} ${destGeo.displayName || ''}`;
  const isLondon = /london|uk|canary wharf|shard|st pancras|kings cross|westminster|heathrow/i.test(combinedLoc);
  const isEurope = /paris|france|berlin|germany|amsterdam|dublin/i.test(combinedLoc);
  const isJapan = /tokyo|japan/i.test(combinedLoc);
  const currencySymbol = isLondon ? '£' : isEurope ? '€' : isJapan ? '¥' : '$';

  // --- 1. DRIVING CALCULATION ---
  let driveTotalMin = gDriving
    ? gDriving.durationMinutes
    : osrmDriving
    ? osrmDriving.durationMinutes
    : actualDriveKm < 5
    ? Math.round((actualDriveKm / 30) * 60) + 2
    : actualDriveKm < 35
    ? Math.round((actualDriveKm / 48) * 60) + 4
    : Math.round((actualDriveKm / 78) * 60) + 8;

  const startHour = new Date(event.startTime).getHours();
  const isRushHour = (startHour >= 7 && startHour <= 9) || (startHour >= 16 && startHour <= 19);
  const driveTrafficDelay = gDriving?.trafficDelayMinutes !== undefined
    ? gDriving.trafficDelayMinutes
    : isRushHour
    ? Math.max(2, Math.round(driveTotalMin * 0.28))
    : Math.max(0, Math.round(driveTotalMin * 0.08));

  if (!gDriving) {
    driveTotalMin += driveTrafficDelay;
  }
  driveTotalMin = Math.max(1, driveTotalMin);

  const driveBuffer = buffers.driving ?? 8;
  const driveLeaveByMs = eventStartTimeMs - (driveTotalMin + driveBuffer) * 60 * 1000;
  const driveEtaMs = driveLeaveByMs + driveTotalMin * 60 * 1000;

  const driveCostText = 'Cost unavailable (fuel, parking and tolls)';

  const drivingOption: RouteOption = {
    mode: 'driving',
    durationMinutes: driveTotalMin,
    distanceKm: actualDriveKm,
    costEstimate: driveCostText,
    co2Kg: parseFloat((actualDriveKm * 0.14).toFixed(2)),
    trafficDelayMinutes: driveTrafficDelay,
    trafficStatus: !gDriving ? 'unknown' : driveTrafficDelay > 10 ? 'heavy' : driveTrafficDelay > 3 ? 'moderate' : 'clear',
    leaveByTime: new Date(driveLeaveByMs).toISOString(),
    etaTime: new Date(driveEtaMs).toISOString(),
    bufferMinutes: driveBuffer,
    updatedAt: new Date().toISOString(),
    encodedPolyline: gDriving?.encodedPolyline,
    steps: gDriving?.steps ?? [],
    dataSource: gDriving ? "Google Routes" : "Estimated fallback",
  };

  // --- 2. TRANSIT CALCULATION ---
  let transitMinutes = gTransit
    ? gTransit.durationMinutes
    : actualDriveKm < 10
    ? Math.round((actualDriveKm / 22) * 60) + 6
    : actualDriveKm < 60
    ? Math.round((actualDriveKm / 36) * 60) + 10
    : Math.round((actualDriveKm / 70) * 60) + 15;

  transitMinutes = Math.max(3, transitMinutes);
  const transitDelay = gTransit ? 0 : isRushHour ? 3 : 0;
  const transitTotalMin = transitMinutes + transitDelay;
  const transitBuffer = buffers.transit ?? 8;
  const transitLeaveByMs = eventStartTimeMs - (transitTotalMin + transitBuffer) * 60 * 1000;
  const transitEtaMs = transitLeaveByMs + transitTotalMin * 60 * 1000;

  const transitCostText = gTransit?.fare ? `${gTransit.fare} (Google fare estimate)` : 'Fare unavailable';

  const transitOption: RouteOption = {
    mode: 'transit',
    transitPreference,
    durationMinutes: transitTotalMin,
    distanceKm: gTransit ? gTransit.distanceKm : parseFloat((actualDriveKm * 1.05).toFixed(1)),
    costEstimate: transitCostText,
    co2Kg: parseFloat((actualDriveKm * 0.035).toFixed(2)),
    trafficDelayMinutes: transitDelay,
    trafficStatus: 'unknown',
    leaveByTime: new Date(transitLeaveByMs).toISOString(),
    etaTime: new Date(transitEtaMs).toISOString(),
    bufferMinutes: transitBuffer,
    updatedAt: new Date().toISOString(),
    encodedPolyline: gTransit?.encodedPolyline,
    steps: gTransit?.steps ?? [],
    dataSource: gTransit ? "Google Routes" : "Estimated fallback",
  };

  // --- 3. BICYCLING CALCULATION ---
  const bikeTotalMin = gBike
    ? gBike.durationMinutes
    : osrmBike
    ? osrmBike.durationMinutes
    : Math.max(2, Math.round(actualBikeKm * 3.75));
  const bikeBuffer = buffers.bicycling ?? 5;
  const bikeLeaveByMs = eventStartTimeMs - (bikeTotalMin + bikeBuffer) * 60 * 1000;
  const bikeEtaMs = bikeLeaveByMs + bikeTotalMin * 60 * 1000;

  const bicyclingOption: RouteOption = {
    mode: 'bicycling',
    durationMinutes: bikeTotalMin,
    distanceKm: actualBikeKm,
    costEstimate: `${currencySymbol}0.00 (Personal Bicycle)`,
    co2Kg: 0.0,
    trafficDelayMinutes: 0,
    trafficStatus: 'unknown',
    leaveByTime: new Date(bikeLeaveByMs).toISOString(),
    etaTime: new Date(bikeEtaMs).toISOString(),
    bufferMinutes: bikeBuffer,
    updatedAt: new Date().toISOString(),
    encodedPolyline: gBike?.encodedPolyline,
    steps: gBike?.steps ?? [],
    dataSource: gBike ? "Google Routes" : "Estimated fallback",
  };

  // --- 4. WALKING CALCULATION ---
  const walkTotalMin = gWalk
    ? gWalk.durationMinutes
    : osrmFoot
    ? osrmFoot.durationMinutes
    : Math.max(1, Math.round(actualWalkKm * 12.5));
  const walkBuffer = buffers.walking ?? 2;
  const walkLeaveByMs = eventStartTimeMs - (walkTotalMin + walkBuffer) * 60 * 1000;
  const walkEtaMs = walkLeaveByMs + walkTotalMin * 60 * 1000;

  const walkingOption: RouteOption = {
    mode: 'walking',
    durationMinutes: walkTotalMin,
    distanceKm: actualWalkKm,
    costEstimate: 'No fare (walking)',
    co2Kg: 0.0,
    trafficDelayMinutes: 0,
    trafficStatus: 'unknown',
    leaveByTime: new Date(walkLeaveByMs).toISOString(),
    etaTime: new Date(walkEtaMs).toISOString(),
    bufferMinutes: walkBuffer,
    updatedAt: new Date().toISOString(),
    encodedPolyline: gWalk?.encodedPolyline,
    steps: gWalk?.steps ?? [],
    dataSource: gWalk ? "Google Routes" : "Estimated fallback",
  };

  return {
    driving: drivingOption,
    transit: transitOption,
    bicycling: bicyclingOption,
    walking: walkingOption,
  };
}
