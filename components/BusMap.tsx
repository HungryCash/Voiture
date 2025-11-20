"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type RouteShape = {
  routeId: number;
  name: string;
  color: string;
  points: [number, number][];
  stops: {
    name: string;
    latitude: number;
    longitude: number;
  }[];
};

type Bus = {
  id: string;
  vehicle_id: number;
  name: string;
  latitude: number;
  longitude: number;
  ground_speed: number;
  heading: number;
  is_delayed: boolean;
  is_on_route: boolean;
  route?: {
    route_name: string;
    color: string;
  };
};

type BusMapProps = {
  buses: Bus[];
  selectedRouteIds?: Set<number>;
};

export default function BusMap({ buses, selectedRouteIds }: BusMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const trailsRef = useRef<{ [key: string]: L.LatLng[] }>({});
  const polylineRef = useRef<{ [key: string]: L.Polyline }>({});
  const routeShapesRef = useRef<{ [key: number]: L.Polyline }>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [routes, setRoutes] = useState<RouteShape[]>([]);

  // Fetch routes on mount
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const response = await fetch('/api/jagline/routes');
        const data = await response.json();
        if (data.success) {
          setRoutes(data.routes);
        }
      } catch (error) {
        console.error('Error fetching routes:', error);
      }
    }
    fetchRoutes();
  }, []);

  useEffect(() => {
    // Initialize map only once
    if (!mapRef.current && mapContainerRef.current) {
      // Center on Indianapolis (IUPUI area)
      const map = L.map(mapContainerRef.current).setView([39.7748, -86.1745], 13);

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    }

    // Draw route shapes
    if (mapRef.current && routes.length > 0) {
      const map = mapRef.current;
      routes.forEach(route => {
        const shouldShow = !selectedRouteIds || selectedRouteIds.size === 0 || selectedRouteIds.has(route.routeId);

        if (routeShapesRef.current[route.routeId]) {
          // Route already exists
          if (!shouldShow) {
            // Hide route
            routeShapesRef.current[route.routeId].remove();
            delete routeShapesRef.current[route.routeId];
          }
        } else if (shouldShow && route.points.length > 0) {
          // Draw route shape
          const routeLine = L.polyline(route.points, {
            color: route.color,
            weight: 4,
            opacity: 0.7,
            smoothFactor: 1
          }).addTo(map);

          routeLine.bindPopup(`<b>${route.name}</b>`);
          routeShapesRef.current[route.routeId] = routeLine;
        }
      });
    }

    // Update bus markers
    if (mapRef.current) {
      const currentMarkerIds = new Set<string>();

      buses.forEach((bus) => {
        const markerId = bus.id;
        currentMarkerIds.add(markerId);

        // Create custom icon based on route color
        const busColor = bus.route?.color || "#0066CC";
        const svgIcon = `
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="${busColor}" stroke="white" stroke-width="3"/>
            <text x="20" y="26" font-size="20" text-anchor="middle" fill="white">🚌</text>
          </svg>
        `;

        const customIcon = L.divIcon({
          html: svgIcon,
          className: "bus-marker",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        // Track bus trail
        const newPosition = L.latLng(bus.latitude, bus.longitude);
        if (!trailsRef.current[markerId]) {
          trailsRef.current[markerId] = [newPosition];
        } else {
          const lastPosition = trailsRef.current[markerId][trailsRef.current[markerId].length - 1];
          // Only add if position changed significantly (> 10 meters)
          if (lastPosition.distanceTo(newPosition) > 10) {
            trailsRef.current[markerId].push(newPosition);
            // Keep only last 50 positions
            if (trailsRef.current[markerId].length > 50) {
              trailsRef.current[markerId].shift();
            }
          }
        }

        // Update or create trail polyline
        if (polylineRef.current[markerId]) {
          polylineRef.current[markerId].setLatLngs(trailsRef.current[markerId]);
        } else if (trailsRef.current[markerId].length > 1) {
          const polyline = L.polyline(trailsRef.current[markerId], {
            color: busColor,
            weight: 3,
            opacity: 0.6,
            smoothFactor: 1
          }).addTo(mapRef.current!);
          polylineRef.current[markerId] = polyline;
        }

        if (markersRef.current[markerId]) {
          // Update existing marker
          markersRef.current[markerId].setLatLng(newPosition);
          markersRef.current[markerId].setIcon(customIcon);
        } else {
          // Create new marker
          const marker = L.marker([bus.latitude, bus.longitude], {
            icon: customIcon,
          }).addTo(mapRef.current!);

          // Add popup
          const popupContent = `
            <div class="p-2">
              <div class="font-bold text-sm">Bus ${bus.name}</div>
              <div class="text-xs text-gray-600">${bus.route?.route_name || "Unknown Route"}</div>
              <div class="mt-2 space-y-1 text-xs">
                <div><strong>Speed:</strong> ${bus.ground_speed.toFixed(0)} mph</div>
                <div><strong>Heading:</strong> ${bus.heading}°</div>
                <div><strong>Status:</strong> ${bus.is_on_route ? "✅ On Route" : "⚠️ Off Route"}</div>
                ${bus.is_delayed ? '<div class="text-red-600"><strong>⚠️ Delayed</strong></div>' : ''}
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          markersRef.current[markerId] = marker;
        }
      });

      // Remove markers and trails for buses that no longer exist
      Object.keys(markersRef.current).forEach((markerId) => {
        if (!currentMarkerIds.has(markerId)) {
          markersRef.current[markerId].remove();
          delete markersRef.current[markerId];

          if (polylineRef.current[markerId]) {
            polylineRef.current[markerId].remove();
            delete polylineRef.current[markerId];
          }
          delete trailsRef.current[markerId];
        }
      });

      // Fit map to show all buses if there are any
      if (buses.length > 0) {
        const bounds = L.latLngBounds(buses.map(b => [b.latitude, b.longitude]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        Object.values(markersRef.current).forEach(marker => marker.remove());
        Object.values(polylineRef.current).forEach(polyline => polyline.remove());
        Object.values(routeShapesRef.current).forEach(routeLine => routeLine.remove());
        markersRef.current = {};
        polylineRef.current = {};
        trailsRef.current = {};
        routeShapesRef.current = {};
      }
    };
  }, [buses, routes, selectedRouteIds]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
