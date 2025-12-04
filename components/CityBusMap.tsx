"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type BusRoute = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  stops: BusStop[];
};

type BusStop = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  routes: string[];
};

type CityBusMapProps = {
  routes: BusRoute[];
  stops: BusStop[];
  onStopClick?: (stop: BusStop) => void;
};

export default function CityBusMap({ routes, stops, onStopClick }: CityBusMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize map only once
    if (!mapRef.current) {
      const map = L.map("citybus-map", {
        center: [40.4267, -86.9196], // Purdue Memorial Union
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;
    }

    // Clear existing markers and routes
    markersRef.current.forEach(marker => marker.remove());
    polylinesRef.current.forEach(polyline => polyline.remove());
    markersRef.current = [];
    polylinesRef.current = [];

    // Create custom icon for bus stops
    const createStopIcon = (color: string) => {
      return L.divIcon({
        html: `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
    };

    // Draw routes as polylines
    routes.forEach(route => {
      if (route.stops.length > 0) {
        const routeCoords: L.LatLngExpression[] = route.stops.map(stop => [stop.lat, stop.lng]);

        const polyline = L.polyline(routeCoords, {
          color: route.color,
          weight: 4,
          opacity: 0.7,
          lineJoin: 'round',
        }).addTo(mapRef.current!);

        polylinesRef.current.push(polyline);
      }
    });

    // Add stop markers
    stops.forEach(stop => {
      // Find the route color for this stop
      const stopRoute = routes.find(r => stop.routes.includes(r.id));
      const color = stopRoute?.color || '#CFB991';

      const marker = L.marker([stop.lat, stop.lng], {
        icon: createStopIcon(color),
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">${stop.name}</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">${stop.address}</p>
        </div>
      `);

      marker.on('click', () => {
        if (onStopClick) {
          onStopClick(stop);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      // Cleanup on unmount
      markersRef.current.forEach(marker => marker.remove());
      polylinesRef.current.forEach(polyline => polyline.remove());
    };
  }, [routes, stops, onStopClick]);

  return (
    <div
      id="citybus-map"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
      }}
    />
  );
}
