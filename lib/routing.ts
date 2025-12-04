/**
 * Simple routing algorithm for campus transit
 * Finds routes between locations using available transit options
 */

type Stop = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  routes: string[];
};

type Route = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  stops: Stop[];
};

type RouteStep = {
  mode: string;
  name: string;
  duration: string;
  from: string;
  to: string;
  icon: string;
  distance?: number;
};

type RouteOption = {
  id: string;
  type: string;
  duration: string;
  price: string;
  transfers: number;
  modes: string[];
  badge?: string;
  steps: RouteStep[];
};

// Campus Transit Routes Data
const CAMPUS_ROUTES: Route[] = [
  {
    id: "discovery-park",
    name: "Discovery Park Loop",
    shortName: "D",
    color: "#CFB991",
    stops: [
      { id: "1", name: "Lynn Hall", address: "Horticulture Greenhouses, 250 West Lafayette, IN", lat: 40.4245, lng: -86.9165, routes: ["discovery-park"] },
      { id: "2", name: "CL50", address: "648 Oval Dr, West Lafayette, IN", lat: 40.4280, lng: -86.9220, routes: ["discovery-park"] },
      { id: "3", name: "Daniels / Russell", address: "Mitch Daniels Blv & Russell St, BUS547", lat: 40.4305, lng: -86.9250, routes: ["discovery-park", "purdue-mall"] },
      { id: "4", name: "MacArthur Dr", address: "Aspire Apts at Discovery Park, BUS011", lat: 40.4355, lng: -86.9270, routes: ["discovery-park"] },
      { id: "5", name: "Airport Rd / District Blvd", address: "1501 W State St, West Lafayette, IN", lat: 40.4125, lng: -86.9360, routes: ["discovery-park"] },
      { id: "6", name: "Niswonger", address: "1452 Aviation Dr, West Lafayette, IN", lat: 40.4085, lng: -86.9395, routes: ["discovery-park"] },
    ]
  },
  {
    id: "purdue-mall",
    name: "Purdue Mall Loop",
    shortName: "P",
    color: "#9CA3AF",
    stops: [
      { id: "7", name: "Armstrong", address: "Armstrong Hall on Stadium Ave, BUS190", lat: 40.4310, lng: -86.9180, routes: ["purdue-mall", "ross-ade"] },
      { id: "8", name: "Electrical Engineering", address: "Electrical Engineering at Shelter, BUS538", lat: 40.4295, lng: -86.9165, routes: ["purdue-mall", "ross-ade"] },
      { id: "9", name: "PMU", address: "425 W State St, West Lafayette, IN", lat: 40.4267, lng: -86.9196, routes: ["purdue-mall", "ross-ade"] },
      { id: "3", name: "Daniels / Russell", address: "Mitch Daniels Blv & Russell St, BUS547", lat: 40.4305, lng: -86.9250, routes: ["discovery-park", "purdue-mall"] },
      { id: "10", name: "Daniels / MacArthur", address: "Aspire Apts at Discovery Park, BUS011", lat: 40.4355, lng: -86.9270, routes: ["purdue-mall"] },
      { id: "11", name: "McCutcheon", address: "McCutcheon Hall on McCutcheon, BUS491E", lat: 40.4340, lng: -86.9245, routes: ["purdue-mall"] },
      { id: "12", name: "Hillenbrand", address: "1301 3rd Street, West Lafayette, IN", lat: 40.4315, lng: -86.9260, routes: ["purdue-mall"] },
      { id: "13", name: "CoRec", address: "RSC on Jischke Dr, BUS362", lat: 40.4285, lng: -86.9235, routes: ["purdue-mall"] },
    ]
  },
  {
    id: "ross-ade",
    name: "Ross-Ade Loop",
    shortName: "R",
    color: "#CFB991",
    stops: [
      { id: "7", name: "Armstrong", address: "Armstrong Hall on Stadium Ave, BUS190", lat: 40.4310, lng: -86.9180, routes: ["purdue-mall", "ross-ade"] },
      { id: "8", name: "Electrical Engineering", address: "Electrical Engineering at Shelter, BUS538", lat: 40.4295, lng: -86.9165, routes: ["purdue-mall", "ross-ade"] },
      { id: "9", name: "PMU", address: "425 W State St, West Lafayette, IN", lat: 40.4267, lng: -86.9196, routes: ["purdue-mall", "ross-ade"] },
      { id: "14", name: "Daniels/University", address: "Matthews (Mary L.) Hall, 812 W State St", lat: 40.4265, lng: -86.9275, routes: ["ross-ade"] },
      { id: "15", name: "Armory", address: "305 N University St, West Lafayette, IN", lat: 40.4289, lng: -86.9205, routes: ["ross-ade"] },
      { id: "16", name: "Tiller Dr", address: "850 Steven Beering Dr, West Lafayette, IN", lat: 40.4335, lng: -86.9210, routes: ["ross-ade"] },
      { id: "17", name: "Hilltop", address: "Tower Dr & Hilltop Dr, BUS472N", lat: 40.4380, lng: -86.9240, routes: ["ross-ade"] },
      { id: "18", name: "David Ross Rd / Tower Dr", address: "800 David Ross Rd, West Lafayette, IN", lat: 40.4400, lng: -86.9200, routes: ["ross-ade"] },
    ]
  }
];

// Helper: Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Estimate duration based on distance
function estimateDuration(distance: number, mode: string): string {
  let actualDistance = distance;
  let speedMph = 15; // Default bus speed

  if (mode === "walk") {
    // For walking, actual path distance is ~1.5x straight-line distance (accounts for roads, paths)
    actualDistance = distance * 1.5;
    // Campus walking speed is slower due to hills, stops, intersections (~2 mph)
    speedMph = 2;
  } else if (mode === "bus") {
    // Bus routes follow roads, so add 1.2x factor
    actualDistance = distance * 1.2;
    speedMph = 15;
  }

  const hours = actualDistance / speedMph;
  const minutes = Math.round(hours * 60);

  // Add 2 minutes minimum for walking (time to walk out of buildings, etc.)
  if (mode === "walk" && minutes < 2) {
    return "2min";
  }

  return minutes < 60 ? `${minutes}min` : `${Math.floor(hours)}h ${minutes % 60}min`;
}

// Find closest stop to a location name
function findClosestStop(locationName: string): Stop | null {
  const lowerLocation = locationName.toLowerCase();

  // First, try exact name match
  for (const route of CAMPUS_ROUTES) {
    for (const stop of route.stops) {
      if (stop.name.toLowerCase().includes(lowerLocation) ||
          lowerLocation.includes(stop.name.toLowerCase())) {
        return stop;
      }
    }
  }

  // Try address match
  for (const route of CAMPUS_ROUTES) {
    for (const stop of route.stops) {
      if (stop.address.toLowerCase().includes(lowerLocation)) {
        return stop;
      }
    }
  }

  return null;
}

// Find direct route between two stops
function findDirectRoute(originStop: Stop, destStop: Stop): RouteOption | null {
  // Check if both stops share a common route
  const commonRoutes = originStop.routes.filter(r => destStop.routes.includes(r));

  if (commonRoutes.length === 0) return null;

  const routeId = commonRoutes[0];
  const route = CAMPUS_ROUTES.find(r => r.id === routeId);
  if (!route) return null;

  // Find stop indices
  const originIndex = route.stops.findIndex(s => s.id === originStop.id);
  const destIndex = route.stops.findIndex(s => s.id === destStop.id);

  if (originIndex === -1 || destIndex === -1) return null;

  // Calculate distance and duration
  const distance = calculateDistance(originStop.lat, originStop.lng, destStop.lat, destStop.lng);
  const duration = estimateDuration(distance, "bus");
  const stopsCount = Math.abs(destIndex - originIndex);

  return {
    id: `direct-${routeId}`,
    type: `${route.name}`,
    duration: duration,
    price: "FREE",
    transfers: 0,
    modes: ["Bus"],
    badge: "DIRECT",
    steps: [
      {
        mode: "bus",
        name: route.name,
        duration: duration,
        from: originStop.name,
        to: destStop.name,
        icon: "🚌",
        distance: distance,
      }
    ]
  };
}

// Find route with one transfer
function findTransferRoute(originStop: Stop, destStop: Stop): RouteOption | null {
  // Find a transfer point (stop that connects both routes)
  let transferStop: Stop | null = null;
  let originRoute: Route | null = null;
  let destRoute: Route | null = null;

  for (const oRouteId of originStop.routes) {
    const oRoute = CAMPUS_ROUTES.find(r => r.id === oRouteId);
    if (!oRoute) continue;

    for (const stop of oRoute.stops) {
      // Check if this stop connects to destination route
      const commonRoutes = stop.routes.filter(r => destStop.routes.includes(r));
      if (commonRoutes.length > 0 && stop.id !== originStop.id) {
        transferStop = stop;
        originRoute = oRoute;
        destRoute = CAMPUS_ROUTES.find(r => r.id === commonRoutes[0]) || null;
        break;
      }
    }
    if (transferStop) break;
  }

  if (!transferStop || !originRoute || !destRoute) return null;

  // Calculate distances and durations
  const dist1 = calculateDistance(originStop.lat, originStop.lng, transferStop.lat, transferStop.lng);
  const dist2 = calculateDistance(transferStop.lat, transferStop.lng, destStop.lat, destStop.lng);
  const dur1 = estimateDuration(dist1, "bus");
  const dur2 = estimateDuration(dist2, "bus");

  // Parse durations to get total
  const totalMins = parseInt(dur1) + parseInt(dur2) + 5; // Add 5 min for transfer
  const totalDuration = totalMins < 60 ? `${totalMins}min` : `${Math.floor(totalMins/60)}h ${totalMins%60}min`;

  return {
    id: `transfer-${originRoute.id}-${destRoute.id}`,
    type: `${originRoute.shortName} → ${destRoute.shortName}`,
    duration: totalDuration,
    price: "FREE",
    transfers: 1,
    modes: ["Bus"],
    steps: [
      {
        mode: "bus",
        name: originRoute.name,
        duration: dur1,
        from: originStop.name,
        to: transferStop.name,
        icon: "🚌",
        distance: dist1,
      },
      {
        mode: "transfer",
        name: "Transfer",
        duration: "5min",
        from: transferStop.name,
        to: transferStop.name,
        icon: "🔄",
      },
      {
        mode: "bus",
        name: destRoute.name,
        duration: dur2,
        from: transferStop.name,
        to: destStop.name,
        icon: "🚌",
        distance: dist2,
      }
    ]
  };
}

/**
 * Check if location is on campus (has a matching stop)
 */
function isOnCampus(location: string): boolean {
  return findClosestStop(location) !== null;
}

/**
 * Get campus transit routes between two on-campus locations
 */
function getCampusRoutes(originStop: Stop, destStop: Stop): RouteOption[] {
  const routes: RouteOption[] = [];

  // Same stop?
  if (originStop.id === destStop.id) {
    return [{
      id: "same-location",
      type: "Walk",
      duration: "0min",
      price: "FREE",
      transfers: 0,
      modes: ["Walk"],
      badge: "ALREADY THERE",
      steps: [
        {
          mode: "walk",
          name: "Already at destination",
          duration: "0min",
          from: originStop.name,
          to: destStop.name,
          icon: "✅",
        }
      ]
    }];
  }

  // Find direct route
  const directRoute = findDirectRoute(originStop, destStop);
  if (directRoute) {
    routes.push(directRoute);
  }

  // Find transfer route
  const transferRoute = findTransferRoute(originStop, destStop);
  if (transferRoute) {
    routes.push(transferRoute);
  }

  // Add walking option if distance is < 1 mile
  const walkDistance = calculateDistance(originStop.lat, originStop.lng, destStop.lat, destStop.lng);
  if (walkDistance < 1.0) {
    const walkDuration = estimateDuration(walkDistance, "walk");
    routes.push({
      id: "walk",
      type: "Walk",
      duration: walkDuration,
      price: "FREE",
      transfers: 0,
      modes: ["Walk"],
      badge: walkDistance < 0.5 ? "NEARBY" : undefined,
      steps: [
        {
          mode: "walk",
          name: "Walk",
          duration: walkDuration,
          from: originStop.name,
          to: destStop.name,
          icon: "🚶",
          distance: walkDistance,
        }
      ]
    });
  }

  return routes;
}

/**
 * Fetch routes from Google Maps API
 */
async function getGoogleMapsRoutes(origin: string, destination: string): Promise<RouteOption[]> {
  try {
    const modes = ["transit", "walking", "driving"];
    const allRoutes: RouteOption[] = [];

    for (const mode of modes) {
      const response = await fetch(
        `/api/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}`
      );

      if (!response.ok) continue;

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        data.routes.forEach((route: any, index: number) => {
          const leg = route.legs[0];
          const steps: RouteStep[] = [];

          leg.steps.forEach((step: any) => {
            const stepMode = step.travel_mode.toLowerCase();
            const icon = stepMode === "walking" ? "🚶" :
                        stepMode === "driving" ? "🚗" :
                        step.transit_details?.line?.vehicle?.type === "BUS" ? "🚌" :
                        step.transit_details?.line?.vehicle?.type === "SUBWAY" ? "🚇" :
                        step.transit_details?.line?.vehicle?.type === "TRAIN" ? "🚂" : "🚌";

            steps.push({
              mode: stepMode,
              name: step.transit_details?.line?.short_name ||
                    step.transit_details?.line?.name ||
                    step.html_instructions?.replace(/<[^>]*>/g, '') ||
                    `${stepMode.charAt(0).toUpperCase() + stepMode.slice(1)}`,
              duration: step.duration.text,
              from: step.transit_details?.departure_stop?.name || leg.start_address,
              to: step.transit_details?.arrival_stop?.name || leg.end_address,
              icon: icon,
            });
          });

          const price = mode === "transit" ? "$2.50-5" : mode === "driving" ? "$5-15" : "FREE";
          const badge = mode === "transit" && index === 0 ? "RECOMMENDED" : undefined;

          allRoutes.push({
            id: `gmaps-${mode}-${index}`,
            type: mode.charAt(0).toUpperCase() + mode.slice(1),
            duration: leg.duration.text,
            price: price,
            transfers: steps.filter(s => s.mode === "transfer").length,
            modes: [mode.charAt(0).toUpperCase() + mode.slice(1)],
            badge: badge,
            steps: steps,
          });
        });
      }
    }

    return allRoutes;
  } catch (error) {
    console.error("Error fetching Google Maps routes:", error);
    return [];
  }
}

/**
 * Main routing function
 * Finds routes between origin and destination
 * Uses campus transit for on-campus routes, Google Maps for off-campus
 */
export async function findRoutes(origin: string, destination: string): Promise<RouteOption[]> {
  const routes: RouteOption[] = [];

  const originOnCampus = isOnCampus(origin);
  const destOnCampus = isOnCampus(destination);

  // Both on campus - use campus transit
  if (originOnCampus && destOnCampus) {
    const originStop = findClosestStop(origin);
    const destStop = findClosestStop(destination);

    if (originStop && destStop) {
      const campusRoutes = getCampusRoutes(originStop, destStop);
      routes.push(...campusRoutes);
    }
  }

  // One or both off campus - use Google Maps
  if (!originOnCampus || !destOnCampus) {
    const gmapsRoutes = await getGoogleMapsRoutes(origin, destination);
    routes.push(...gmapsRoutes);
  }

  // If no routes found, provide helpful message
  if (routes.length === 0) {
    return [];
  }

  return routes;
}

/**
 * Get all available stops for autocomplete
 */
export function getAllStops(): Stop[] {
  const stopsMap = new Map<string, Stop>();

  for (const route of CAMPUS_ROUTES) {
    for (const stop of route.stops) {
      if (!stopsMap.has(stop.id)) {
        stopsMap.set(stop.id, stop);
      }
    }
  }

  return Array.from(stopsMap.values());
}
