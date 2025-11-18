import { NextResponse } from 'next/server';

// Jagline API endpoint for route shapes
const JAGLINE_ROUTES_API = 'https://iupui.ridesystems.net/Services/JSONPRelay.svc/GetRoutesForMap?apiKey=8882812681';

type MapPoint = {
  Latitude: number;
  Longitude: number;
  Heading: number;
};

type RouteStop = {
  Description: string;
  Latitude: number;
  Longitude: number;
  MapPoints: MapPoint[];
};

type JaglineRoute = {
  RouteID: number;
  Description: string;
  MapLineColor: string;
  Stops: RouteStop[];
};

export async function GET() {
  try {
    const response = await fetch(JAGLINE_ROUTES_API, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Voiture-Transit-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Jagline API error: ${response.status}`);
    }

    const routes: JaglineRoute[] = await response.json();

    // Transform the data to a simpler format
    const transformedRoutes = routes.map(route => {
      // Collect all MapPoints from all stops to draw the complete route
      const allPoints: [number, number][] = [];

      route.Stops.forEach(stop => {
        if (stop.MapPoints && stop.MapPoints.length > 0) {
          stop.MapPoints.forEach(point => {
            allPoints.push([point.Latitude, point.Longitude]);
          });
        }
      });

      return {
        routeId: route.RouteID,
        name: route.Description,
        color: route.MapLineColor || '#0066CC',
        points: allPoints,
        stops: route.Stops.map(stop => ({
          name: stop.Description,
          latitude: stop.Latitude,
          longitude: stop.Longitude
        }))
      };
    });

    return NextResponse.json({
      success: true,
      routes: transformedRoutes,
      count: transformedRoutes.length
    });

  } catch (error: any) {
    console.error('Error fetching Jagline routes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch route data'
      },
      { status: 500 }
    );
  }
}
