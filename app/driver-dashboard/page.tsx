"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, MapPin, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type BusStop = {
  id: string;
  name: string;
  waitingPassengers: number;
  estimatedArrival: string;
  address: string;
  status: "normal" | "crowded" | "urgent";
};

export default function DriverDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [currentRoute] = useState("4B Silver Loop");
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState("Driver");

  useEffect(() => {
    checkAuth();
    loadBusStops();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('passenger-counts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'passenger_counts'
      }, () => {
        loadBusStops(); // Reload data when counts change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth');
      return;
    }

    // Get driver profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'driver') {
      router.push('/');
      return;
    }

    setDriverName(profile.full_name || 'Driver');
  }

  async function loadBusStops() {
    try {
      // Get bus stops with latest passenger counts
      const { data: stops, error } = await supabase
        .from('bus_stops')
        .select(`
          id,
          name,
          address,
          route_id,
          passenger_counts (
            count,
            status,
            timestamp
          )
        `)
        .eq('route_id', '4B')
        .order('name');

      if (error) throw error;

      // Transform data and add estimated arrival times
      const transformedStops: BusStop[] = stops.map((stop: any, index: number) => {
        const latestCount = stop.passenger_counts?.[0] || { count: 0, status: 'normal' };

        return {
          id: stop.id,
          name: stop.name,
          waitingPassengers: latestCount.count,
          estimatedArrival: `${(index + 1) * 5} min`,
          address: stop.address,
          status: latestCount.status as "normal" | "crowded" | "urgent",
        };
      });

      setBusStops(transformedStops);
    } catch (error) {
      console.error('Error loading bus stops:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  const nextStop = busStops[0]?.name || "Loading...";

  // Mock data fallback - This will be replaced with real-time data from Raspberry Pi/Flipper Zero
  const mockBusStops: BusStop[] = [
    {
      id: "1",
      name: "Purdue Memorial Union",
      waitingPassengers: 8,
      estimatedArrival: "2 min",
      address: "101 N Grant St",
      status: "normal",
    },
    {
      id: "2",
      name: "Krannert Building",
      waitingPassengers: 15,
      estimatedArrival: "7 min",
      address: "403 W State St",
      status: "crowded",
    },
    {
      id: "3",
      name: "Córdova Recreational Sports Center",
      waitingPassengers: 3,
      estimatedArrival: "12 min",
      address: "900 John R Wooden Dr",
      status: "normal",
    },
    {
      id: "4",
      name: "Harrison Hall",
      waitingPassengers: 22,
      estimatedArrival: "18 min",
      address: "525 Russell St",
      status: "urgent",
    },
    {
      id: "5",
      name: "Purdue Village",
      waitingPassengers: 6,
      estimatedArrival: "25 min",
      address: "1050 3rd St",
      status: "normal",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "urgent":
        return "bg-red-500";
      case "crowded":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "urgent":
        return "destructive";
      case "crowded":
        return "secondary";
      default:
        return "outline";
    }
  };

  const displayStops = busStops.length > 0 ? busStops : mockBusStops;
  const totalWaiting = displayStops.reduce((sum, stop) => sum + stop.waitingPassengers, 0);
  const urgentStops = displayStops.filter((stop) => stop.status === "urgent").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <p className="text-sm opacity-90">Welcome, {driverName}</p>
            <p className="text-xs opacity-75">Route: {currentRoute}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
            <div className="text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary-foreground" />
              <div className="text-2xl font-bold text-primary-foreground">{totalWaiting}</div>
              <div className="text-xs opacity-90">Total Waiting</div>
            </div>
          </Card>
          <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
            <div className="text-center">
              <MapPin className="h-5 w-5 mx-auto mb-1 text-primary-foreground" />
              <div className="text-2xl font-bold text-primary-foreground">{displayStops.length}</div>
              <div className="text-xs opacity-90">Stops Ahead</div>
            </div>
          </Card>
          <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
            <div className="text-center">
              <AlertCircle className="h-5 w-5 mx-auto mb-1 text-primary-foreground" />
              <div className="text-2xl font-bold text-primary-foreground">{urgentStops}</div>
              <div className="text-xs opacity-90">Urgent</div>
            </div>
          </Card>
        </div>
      </header>

      {/* Next Stop Alert */}
      <div className="p-4">
        <Card className="p-4 border-l-4 border-l-primary bg-blue-50">
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-full">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Next Stop</h3>
              <p className="text-sm font-medium">{nextStop}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ETA: {displayStops[0]?.estimatedArrival}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {displayStops[0]?.waitingPassengers} waiting
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Stops */}
      <main className="flex-1 p-4 pt-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Upcoming Stops</h2>
          <Button variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        <div className="space-y-3">
          {displayStops.map((stop, index) => (
            <Card
              key={stop.id}
              className={`p-4 ${
                index === 0 ? "border-2 border-primary" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Stop Number */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full ${getStatusColor(
                      stop.status
                    )} text-white flex items-center justify-center font-bold text-sm`}
                  >
                    {index + 1}
                  </div>
                  {index < displayStops.length - 1 && (
                    <div className="w-0.5 h-12 bg-muted mt-2"></div>
                  )}
                </div>

                {/* Stop Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{stop.name}</h3>
                      <p className="text-xs text-muted-foreground">{stop.address}</p>
                    </div>
                    <Badge variant={getStatusBadge(stop.status) as any}>
                      {stop.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{stop.waitingPassengers}</span>
                      <span className="text-muted-foreground">waiting</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">ETA: {stop.estimatedArrival}</span>
                    </div>
                  </div>

                  {/* Alert for crowded stops */}
                  {stop.status === "urgent" && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-800">
                        High passenger count - consider requesting additional bus
                      </span>
                    </div>
                  )}
                  {stop.status === "crowded" && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-800">
                        Moderate passenger count - monitor capacity
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Request Backup Button */}
        <Card className="p-4 mt-4 bg-orange-50 border-orange-200">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Need Additional Support?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Request a backup bus for high-capacity stops
            </p>
            <Button className="w-full" variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              Request Backup Bus
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-4 mt-4 bg-blue-50">
          <div className="text-sm">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Passenger Count System
            </h4>
            <p className="text-muted-foreground text-xs">
              Passenger counts are detected using IoT sensors at each bus stop. Data is updated
              in real-time to help optimize route efficiency and passenger experience.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
