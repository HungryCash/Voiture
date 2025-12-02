"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type ShuttleMapProps = {
  busPosition: { lat: number; lng: number; progress: number };
  origin: [number, number];
  destination: [number, number];
  originName: string;
  destinationName: string;
};

export default function ShuttleMap({
  busPosition,
  origin,
  destination,
  originName,
  destinationName
}: ShuttleMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      mapRef.current = L.map("shuttle-map").setView([busPosition.lat, busPosition.lng], 8);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
      }).addTo(mapRef.current);

      // Add origin marker
      L.marker(origin, {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap;">📍 ${originName}</div>`,
          iconSize: [100, 30]
        })
      }).addTo(mapRef.current);

      // Add destination marker
      L.marker(destination, {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap;">🏁 ${destinationName}</div>`,
          iconSize: [100, 30]
        })
      }).addTo(mapRef.current);

      // Draw route line
      routeLineRef.current = L.polyline([origin, destination], {
        color: "#3b82f6",
        weight: 3,
        opacity: 0.6,
        dashArray: "10, 10"
      }).addTo(mapRef.current);

      // Add bus marker
      busMarkerRef.current = L.marker([busPosition.lat, busPosition.lng], {
        icon: L.divIcon({
          className: "bus-marker",
          html: `<div style="background: #fbbf24; color: white; padding: 6px; border-radius: 50%; font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🚌</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(mapRef.current);

      // Fit bounds to show entire route
      mapRef.current.fitBounds([origin, destination], { padding: [50, 50] });
    }

    // Update bus position
    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng([busPosition.lat, busPosition.lng]);

      // Update popup
      busMarkerRef.current
        .bindPopup(
          `<b>Campus Shuttle</b><br/>Progress: ${busPosition.progress.toFixed(1)}%<br/>Lat: ${busPosition.lat.toFixed(6)}<br/>Lng: ${busPosition.lng.toFixed(6)}`
        )
        .openPopup();

      // Pan map to follow bus
      if (mapRef.current) {
        mapRef.current.panTo([busPosition.lat, busPosition.lng]);
      }
    }
  }, [busPosition, origin, destination, originName, destinationName]);

  return <div id="shuttle-map" className="w-full h-96 rounded-lg shadow" />;
}
