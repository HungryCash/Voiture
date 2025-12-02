"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const ShuttleMap = dynamic(() => import("@/components/ShuttleMap"), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse" />
});

type Booking = {
  id: string;
  booking_code: string;
  passenger_name: string;
  ride: {
    id: string;
    departure_time: string;
    origin: string;
    destination: string;
    origin_coords: string;
    destination_coords: string;
  };
};

type BusPosition = {
  lat: number;
  lng: number;
  progress: number;
  estimated_arrival: string;
};

export default function TrackShuttlePage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [busPosition, setBusPosition] = useState<BusPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (code) {
      fetchBooking();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [code]);

  async function fetchBooking() {
    const { data, error } = await supabase
      .from("shuttle_bookings")
      .select(`
        id,
        booking_code,
        passenger_name,
        ride:shuttle_rides(
          id,
          departure_time,
          origin,
          destination,
          origin_coords,
          destination_coords
        )
      `)
      .eq("booking_code", code)
      .single();

    if (error || !data) {
      setError("Booking not found");
      setLoading(false);
      return;
    }

    setBooking(data as any);
    startSimulation(data as any);
    setLoading(false);
  }

  function parseCoords(coordString: string): [number, number] {
    // PostgreSQL POINT format: "(lat,lng)"
    const match = coordString.match(/\(([-\d.]+),([-\d.]+)\)/);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return [0, 0];
  }

  function startSimulation(booking: Booking) {
    // FOR TESTING: Force simulation to start immediately
    const departureTime = new Date(); // Start now for testing
    const now = new Date();

    // Journey duration: 90 seconds for simulation (real journey is 2 hours)
    const journeyDuration = 90000; // 90 seconds in milliseconds
    const estimatedArrival = new Date(departureTime.getTime() + journeyDuration);

    // TESTING MODE: Always start simulation regardless of actual departure time
    // if (now < departureTime) {
    //   const [lat, lng] = parseCoords(booking.ride.origin_coords);
    //   setBusPosition({
    //     lat,
    //     lng,
    //     progress: 0,
    //     estimated_arrival: estimatedArrival.toISOString()
    //   });
    //   return;
    // }

    // Calculate current progress
    const elapsed = now.getTime() - departureTime.getTime();
    const progress = Math.min((elapsed / journeyDuration) * 100, 100);

    // If journey is complete, show bus at destination
    if (progress >= 100) {
      const [lat, lng] = parseCoords(booking.ride.destination_coords);
      setBusPosition({
        lat,
        lng,
        progress: 100,
        estimated_arrival: estimatedArrival.toISOString()
      });
      return;
    }

    // Simulate movement along route
    updateBusPosition(booking, progress, estimatedArrival);

    // Update position every 2 seconds for smooth animation
    intervalRef.current = setInterval(() => {
      const newNow = new Date();
      const newElapsed = newNow.getTime() - departureTime.getTime();
      const newProgress = Math.min((newElapsed / journeyDuration) * 100, 100);

      if (newProgress >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const [lat, lng] = parseCoords(booking.ride.destination_coords);
        setBusPosition({
          lat,
          lng,
          progress: 100,
          estimated_arrival: estimatedArrival.toISOString()
        });
      } else {
        updateBusPosition(booking, newProgress, estimatedArrival);
      }
    }, 2000); // Update every 2 seconds for smooth animation
  }

  function updateBusPosition(booking: Booking, progress: number, estimatedArrival: Date) {
    const [originLat, originLng] = parseCoords(booking.ride.origin_coords);
    const [destLat, destLng] = parseCoords(booking.ride.destination_coords);

    // Linear interpolation between origin and destination
    const progressRatio = progress / 100;
    const currentLat = originLat + (destLat - originLat) * progressRatio;
    const currentLng = originLng + (destLng - originLng) * progressRatio;

    setBusPosition({
      lat: currentLat,
      lng: currentLng,
      progress,
      estimated_arrival: estimatedArrival.toISOString()
    });
  }

  function copyShareLink() {
    const shareUrl = `${window.location.origin}/shuttle/track/${code}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Share link copied to clipboard!");
  }

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading tracking information...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4">{error || "Booking not found"}</p>
        <button
          onClick={() => router.push("/shuttle")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Go to Shuttle Page
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <button onClick={() => router.push("/shuttle")} className="mb-2">
          ← Back to Shuttle
        </button>
        <h1 className="text-xl font-bold">Live Shuttle Tracker</h1>
        <p className="text-sm text-blue-100">Tracking Code: {code}</p>
      </div>

      {/* Ride Info */}
      <div className="bg-white p-4 shadow">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-bold text-lg">{booking.ride.origin} → {booking.ride.destination}</p>
            <p className="text-sm text-gray-600">
              Departed: {formatTime(booking.ride.departure_time)}
            </p>
            {busPosition && (
              <>
                <p className="text-sm text-gray-600">
                  ETA: {formatTime(busPosition.estimated_arrival)}
                </p>
                <p className="text-sm text-blue-600 font-medium mt-1">
                  Progress: {busPosition.progress.toFixed(1)}%
                </p>
              </>
            )}
          </div>
          <button
            onClick={copyShareLink}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          >
            📤 Share
          </button>
        </div>

        {/* Progress Bar */}
        {busPosition && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${busPosition.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Map */}
      <div className="p-4">
        {busPosition && booking && (
          <ShuttleMap
            busPosition={busPosition}
            origin={parseCoords(booking.ride.origin_coords)}
            destination={parseCoords(booking.ride.destination_coords)}
            originName={booking.ride.origin}
            destinationName={booking.ride.destination}
          />
        )}
      </div>

      {/* Status Message */}
      <div className="p-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-800">
            {busPosition && busPosition.progress < 100
              ? "🚌 Your shuttle is on the way!"
              : busPosition && busPosition.progress === 100
              ? "✅ Your shuttle has arrived at the destination!"
              : "⏳ Your shuttle will depart soon..."}
          </p>
        </div>
      </div>
    </div>
  );
}
