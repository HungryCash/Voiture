import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Jagline API endpoint
const JAGLINE_API_URL = 'https://iupui.ridesystems.net/Services/JSONPRelay.svc/GetMapVehiclePoints?apiKey=8882812681&isPublicMap=true';

type JaglineVehicle = {
  VehicleID: number;
  Name: string;
  RouteID: number;
  Latitude: number;
  Longitude: number;
  GroundSpeed: number;
  Heading: number;
  IsDelayed: boolean;
  IsOnRoute: boolean;
  TimeStamp: string;
  Seconds: number;
};

export async function GET() {
  try {
    // Fetch live data from Jagline API
    const response = await fetch(JAGLINE_API_URL, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Voiture-Transit-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Jagline API error: ${response.status}`);
    }

    const vehicles: JaglineVehicle[] = await response.json();

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No buses currently active'
      });
    }

    // Initialize Supabase
    const supabase = await createClient();

    // First, ensure all routes exist in the database
    const uniqueRouteIds = [...new Set(vehicles.map(v => v.RouteID))];

    for (const routeId of uniqueRouteIds) {
      // Check if route exists, if not create a placeholder
      const { data: existingRoute } = await supabase
        .from('jagline_routes')
        .select('route_id')
        .eq('route_id', routeId)
        .single();

      if (!existingRoute) {
        // Create placeholder route
        const { error: insertError } = await supabase
          .from('jagline_routes')
          .insert({
            route_id: routeId,
            route_name: `Route ${routeId}`,
            route_number: String(routeId),
            color: '#0066CC' // Default blue color
          });

        // Ignore conflict errors (route already exists)
        if (insertError && !insertError.message.includes('duplicate')) {
          console.error(`Error creating route ${routeId}:`, insertError);
        }
      }
    }

    // Update each bus position in database
    const updates = await Promise.all(
      vehicles.map(async (vehicle) => {
        // Parse timestamp from API format: "/Date(1763523075000-0700)/"
        const timestampMatch = vehicle.TimeStamp.match(/\/Date\((\d+)/);
        const apiTimestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();

        // Upsert bus position using our function
        const { error } = await supabase.rpc('upsert_jagline_bus_position', {
          p_vehicle_id: vehicle.VehicleID,
          p_name: vehicle.Name,
          p_route_id: vehicle.RouteID,
          p_latitude: vehicle.Latitude,
          p_longitude: vehicle.Longitude,
          p_ground_speed: vehicle.GroundSpeed,
          p_heading: vehicle.Heading,
          p_is_delayed: vehicle.IsDelayed,
          p_is_on_route: vehicle.IsOnRoute,
          p_api_timestamp: apiTimestamp
        });

        if (error) {
          console.error(`Error updating vehicle ${vehicle.VehicleID}:`, error);
          return { success: false, vehicleId: vehicle.VehicleID, error: error.message };
        }

        return { success: true, vehicleId: vehicle.VehicleID };
      })
    );

    const successCount = updates.filter(u => u.success).length;
    const failureCount = updates.filter(u => !u.success).length;

    return NextResponse.json({
      success: true,
      count: successCount,
      failures: failureCount,
      total: vehicles.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error syncing Jagline data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync bus data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
