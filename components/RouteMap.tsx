"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "400px",
};

const defaultCenter = {
  lat: 40.4259,
  lng: -86.9081, // West Lafayette, IN
};

interface RouteMapProps {
  origin: string;
  destination: string;
  waypoints?: Array<{ location: string; stopover: boolean }>;
}

export default function RouteMap({ origin, destination, waypoints = [] }: RouteMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Get API key from environment variable
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  useEffect(() => {
    if (!isLoaded || !directionsServiceRef.current) return;

    const directionsService = directionsServiceRef.current;

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setError(null);
          
          // Fit map to route bounds
          if (mapRef.current && result.routes[0]) {
            const bounds = new google.maps.LatLngBounds();
            result.routes[0].legs.forEach((leg) => {
              bounds.extend(leg.start_location);
              bounds.extend(leg.end_location);
            });
            mapRef.current.fitBounds(bounds);
          }
        } else {
          setError(`Failed to load directions: ${status}`);
          console.error("Directions request failed:", status);
        }
      }
    );
  }, [origin, destination, waypoints, isLoaded]);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    directionsServiceRef.current = new google.maps.DirectionsService();
  };

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted">
        <p className="text-muted-foreground text-center p-4">
          Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle} className="relative">
      {error && (
        <div className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground p-2 rounded text-sm max-w-xs">
          {error}
        </div>
      )}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </div>
  );
}

