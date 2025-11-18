"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Battery, MapPin, DollarSign, Clock, Filter } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Scooter = {
  id: string;
  scooter_id: string;
  provider: "lime" | "veo" | "bird";
  latitude: number;
  longitude: number;
  battery_level: number;
  status: "available" | "in_use" | "low_battery" | "maintenance";
  price_per_minute: number;
  unlock_fee: number;
  distance?: number; // Will be calculated
};

export default function ScootersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [filteredScooters, setFilteredScooters] = useState<Scooter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [searchLocation, setSearchLocation] = useState("IUPUI Campus");
  const [userLocation] = useState({ lat: 39.7748, lng: -86.1745 }); // IUPUI Campus Center

  useEffect(() => {
    loadScooters();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('scooters-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scooters'
      }, () => {
        loadScooters();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterScooters();
  }, [scooters, selectedProvider]);

  async function loadScooters() {
    try {
      const { data, error } = await supabase
        .from('scooters')
        .select('*')
        .in('status', ['available', 'low_battery'])
        .order('battery_level', { ascending: false });

      if (error) throw error;

      // Calculate distance from user location
      const scootersWithDistance = data.map((scooter: any) => ({
        ...scooter,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          scooter.latitude,
          scooter.longitude
        ),
      }));

      // Sort by distance
      scootersWithDistance.sort((a, b) => a.distance - b.distance);

      setScooters(scootersWithDistance);
    } catch (error) {
      console.error('Error loading scooters:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterScooters() {
    if (selectedProvider === "all") {
      setFilteredScooters(scooters);
    } else {
      setFilteredScooters(scooters.filter(s => s.provider === selectedProvider));
    }
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  function getProviderColor(provider: string) {
    switch (provider) {
      case "lime":
        return "bg-green-500";
      case "veo":
        return "bg-blue-500";
      case "bird":
        return "bg-black";
      default:
        return "bg-gray-500";
    }
  }

  function getBatteryColor(level: number) {
    if (level >= 70) return "text-green-600";
    if (level >= 40) return "text-yellow-600";
    return "text-red-600";
  }

  async function handleReserveScooter(scooterId: string) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth');
      return;
    }

    // Create a reservation
    const { error } = await supabase
      .from('scooter_rides')
      .insert({
        user_id: user.id,
        scooter_id: scooterId,
        start_latitude: userLocation.lat,
        start_longitude: userLocation.lng,
        status: 'reserved'
      });

    if (error) {
      alert('Failed to reserve scooter: ' + error.message);
      return;
    }

    alert('Scooter reserved! You have 5 minutes to start your ride.');
    loadScooters(); // Refresh to show scooter as reserved
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Finding scooters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center mb-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold ml-2">Find a Scooter</h1>
        </div>

        {/* Search Location */}
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="pl-10 bg-white"
            placeholder="Search location..."
          />
        </div>
      </header>

      {/* Filters */}
      <div className="p-4 bg-white border-b sticky top-[120px] z-10">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by provider:</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedProvider === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("all")}
          >
            All ({scooters.length})
          </Button>
          <Button
            variant={selectedProvider === "lime" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("lime")}
            className={selectedProvider === "lime" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            🛴 Lime ({scooters.filter(s => s.provider === "lime").length})
          </Button>
          <Button
            variant={selectedProvider === "veo" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("veo")}
            className={selectedProvider === "veo" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            🛴 Veo ({scooters.filter(s => s.provider === "veo").length})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold">{filteredScooters.length}</div>
            <div className="text-xs opacity-90">Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {filteredScooters.length > 0 ? filteredScooters[0].distance?.toFixed(1) : "0"} km
            </div>
            <div className="text-xs opacity-90">Nearest</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              ${filteredScooters.length > 0 ? filteredScooters[0].price_per_minute?.toFixed(2) : "0.39"}/min
            </div>
            <div className="text-xs opacity-90">Starting at</div>
          </div>
        </div>
      </div>

      {/* Scooter List */}
      <main className="flex-1 p-4 space-y-3 pb-20">
        {filteredScooters.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-2">No scooters available nearby</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or location</p>
          </Card>
        ) : (
          filteredScooters.map((scooter) => (
            <Card key={scooter.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                {/* Provider Badge */}
                <div className={`w-16 h-16 ${getProviderColor(scooter.provider)} rounded-lg flex items-center justify-center text-white text-2xl font-bold`}>
                  🛴
                </div>

                {/* Scooter Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold capitalize">{scooter.provider} Scooter</h3>
                      <p className="text-xs text-muted-foreground">ID: {scooter.scooter_id}</p>
                    </div>
                    <Badge
                      variant={scooter.status === "available" ? "default" : "secondary"}
                      className={scooter.status === "available" ? "bg-green-600" : ""}
                    >
                      {scooter.status}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <Battery className={`h-4 w-4 ${getBatteryColor(scooter.battery_level)}`} />
                      <span className="font-medium">{scooter.battery_level}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{scooter.distance?.toFixed(2)} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">${scooter.price_per_minute}/min</span>
                    </div>
                  </div>

                  {/* Pricing Info */}
                  <div className="bg-muted rounded p-2 mb-3 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Unlock fee:</span>
                      <span className="font-medium">${scooter.unlock_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. 10 min ride:</span>
                      <span className="font-medium">
                        ${(scooter.unlock_fee + (scooter.price_per_minute * 10)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={scooter.status !== "available"}
                    onClick={() => handleReserveScooter(scooter.id)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Reserve Scooter
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t bg-background p-4 fixed bottom-0 left-0 right-0 max-w-md mx-auto">
        <div className="flex justify-around">
          <Link href="/">
            <Button variant="ghost" className="flex-1">
              Home
            </Button>
          </Link>
          <Link href="/routes">
            <Button variant="ghost" className="flex-1">
              Routes
            </Button>
          </Link>
          <Button variant="default" className="flex-1">
            Scooters
          </Button>
        </div>
      </nav>
    </div>
  );
}
