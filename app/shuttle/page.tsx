"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type ShuttleRide = {
  id: string;
  departure_time: string;
  origin: string;
  destination: string;
  capacity: number;
  booked_seats: number;
  status: string;
};

type Booking = {
  id: string;
  booking_code: string;
  passenger_count: number;
  ride: ShuttleRide;
};

export default function ShuttlePage() {
  const [activeTab, setActiveTab] = useState<"wl-to-indy" | "indy-to-wl">("wl-to-indy");
  const [rides, setRides] = useState<ShuttleRide[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchRides();
    fetchMyBookings();
  }, [activeTab, selectedDate]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    setUser(user);
  }

  async function fetchRides() {
    setLoading(true);
    const origin = activeTab === "wl-to-indy" ? "West Lafayette" : "Indianapolis";
    const destination = activeTab === "wl-to-indy" ? "Indianapolis" : "West Lafayette";

    const { data, error } = await supabase
      .from("shuttle_rides")
      .select("*")
      .eq("origin", origin)
      .eq("destination", destination)
      .gte("departure_time", `${selectedDate}T00:00:00`)
      .lte("departure_time", `${selectedDate}T23:59:59`)
      .order("departure_time", { ascending: true });

    if (error) {
      console.error("Error fetching rides:", error);
    } else {
      setRides(data || []);
    }
    setLoading(false);
  }

  async function fetchMyBookings() {
    if (!user) return;

    const { data, error } = await supabase
      .from("shuttle_bookings")
      .select(`
        id,
        booking_code,
        passenger_count,
        ride:shuttle_rides(*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
    } else {
      // Filter out bookings without rides and show all bookings
      setMyBookings(data as any || []);
    }
  }

  async function bookRide(rideId: string) {
    if (!user) return;

    // Check if user already has a booking for this ride
    const { data: existingBooking } = await supabase
      .from("shuttle_bookings")
      .select("id, booking_code")
      .eq("user_id", user.id)
      .eq("ride_id", rideId)
      .single();

    if (existingBooking) {
      alert(`You've already booked this ride! Your booking code: ${existingBooking.booking_code}`);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const passengerName = profile?.full_name || "Guest";

    const { data, error } = await supabase.rpc("book_shuttle_ride", {
      p_user_id: user.id,
      p_ride_id: rideId,
      p_passenger_name: passengerName,
      p_passenger_count: 1
    });

    if (error) {
      // Check if it's a duplicate booking error
      if (error.message.includes("duplicate key") || error.message.includes("shuttle_bookings_user_id_ride_id_key")) {
        alert("You've already booked this ride!");
      } else {
        alert("Booking failed: " + error.message);
      }
    } else if (data && data[0]) {
      if (data[0].success) {
        alert(`Booking successful! Your code: ${data[0].booking_code}`);
        fetchRides();
        fetchMyBookings();
      } else {
        alert(data[0].message);
      }
    }
  }

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  function isRideDeparting(departureTime: string) {
    // FOR TESTING: Always show Track Live button
    return true;

    // PRODUCTION CODE (uncomment when done testing):
    // const now = new Date();
    // const departure = new Date(departureTime);
    // const diff = departure.getTime() - now.getTime();
    // return diff <= 0 && diff > -7200000; // Within 2 hours after departure
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-black text-[#CFB991] p-4">
        <button onClick={() => router.push("/")} className="mb-2">
          ← Back
        </button>
        <h1 className="text-xl font-bold">Campus Shuttle v2.1</h1>
        <p className="text-sm text-[#CFB991]/80">Book your ride between campuses</p>
      </div>

      {/* Date Picker */}
      <div className="bg-white p-3 shadow">
        <label className="text-sm text-gray-600">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab("wl-to-indy")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "wl-to-indy"
                ? "border-b-2 border-[#CFB991] text-[#CFB991]"
                : "text-gray-500"
            }`}
          >
            West Lafayette → Indianapolis
          </button>
          <button
            onClick={() => setActiveTab("indy-to-wl")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "indy-to-wl"
                ? "border-b-2 border-[#CFB991] text-[#CFB991]"
                : "text-gray-500"
            }`}
          >
            Indianapolis → West Lafayette
          </button>
        </div>
      </div>

      {/* My Bookings */}
      {myBookings.length > 0 && (
        <div className="p-4">
          <h2 className="font-bold text-lg mb-2">My Bookings</h2>
          {myBookings.filter(booking => booking.ride).map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow p-3 mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{booking.ride.origin} → {booking.ride.destination}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.ride.departure_time).toLocaleDateString()} at {formatTime(booking.ride.departure_time)}
                  </p>
                  <p className="text-xs text-blue-600 font-mono mt-1">Code: {booking.booking_code}</p>
                </div>
                {isRideDeparting(booking.ride.departure_time) && (
                  <button
                    onClick={() => router.push(`/shuttle/track/${booking.booking_code}`)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Track Live
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available Rides */}
      <div className="p-4">
        <h2 className="font-bold text-lg mb-2">
          {activeTab === "wl-to-indy" ? "From West Lafayette" : "From Indianapolis"}
        </h2>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading rides...</p>
        ) : rides.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No rides available for this date</p>
        ) : (
          <div className="space-y-2">
            {rides.map((ride) => {
              const isPast = new Date(ride.departure_time) < new Date();
              const seatsLeft = ride.capacity - ride.booked_seats;
              const hasBooking = myBookings.some(b => b.ride && b.ride.id === ride.id);

              return (
                <div key={ride.id} className="bg-white rounded-lg shadow p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{formatTime(ride.departure_time)}</p>
                      <p className="text-sm text-gray-600">
                        {ride.origin} → {ride.destination}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {seatsLeft} seats left ({ride.booked_seats}/{ride.capacity})
                      </p>
                    </div>
                    <div>
                      {hasBooking ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
                          Booked ✓
                        </span>
                      ) : isPast ? (
                        <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded text-sm">
                          Departed
                        </span>
                      ) : seatsLeft === 0 ? (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm">
                          Full
                        </span>
                      ) : (
                        <button
                          onClick={() => bookRide(ride.id)}
                          className="bg-[#CFB991] text-black px-4 py-2 rounded text-sm hover:bg-[#CEB888] font-medium"
                        >
                          Book
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
