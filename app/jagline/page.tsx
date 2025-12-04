"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Gauge, Navigation, Clock, RefreshCw, Map as MapIcon, List } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

// Dynamically import map to avoid SSR issues
const BusMap = dynamic(() => import("@/components/BusMap"), { ssr: false });

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

type JaglineRoute = {
  id: string;
  route_id: number;
  route_name: string;
  route_number: string;
  color: string;
  is_active: boolean;
};

type JaglineBus = {
  id: string;
  vehicle_id: number;
  name: string;
  route_id: number;
  latitude: number;
  longitude: number;
  ground_speed: number;
  heading: number;
  is_delayed: boolean;
  is_on_route: boolean;
  last_updated: string;
  route?: JaglineRoute;
};

export default function JaglinePage() {
  const supabase = createClient();
  const [buses, setBuses] = useState<JaglineBus[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<JaglineBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedRoutes, setSelectedRoutes] = useState<Set<number>>(new Set());
  const [availableRoutes, setAvailableRoutes] = useState<{id: number, name: string, color: string}[]>([]);

  useEffect(() => {
    loadBuses();
    fetchLiveData(); // Initial fetch from API

    // Subscribe to real-time updates
    const channel = supabase
      .channel('jagline-buses-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jagline_buses'
      }, () => {
        loadBuses();
      })
      .subscribe();

    // Fetch live data every 10 seconds
    const interval = setInterval(() => {
      fetchLiveData();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  async function loadBuses() {
    try {
      const { data, error } = await supabase
        .from('jagline_buses')
        .select(`
          *,
          route:jagline_routes!jagline_buses_route_id_fkey (
            id,
            route_id,
            route_name,
            route_number,
            color,
            is_active
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      setBuses(data || []);

      // Extract unique routes
      const routesMap = new Map<number, {id: number, name: string, color: string}>();
      data?.forEach(bus => {
        if (bus.route_id && !routesMap.has(bus.route_id)) {
          routesMap.set(bus.route_id, {
            id: bus.route_id,
            name: bus.route?.route_name || `Route ${bus.route_id}`,
            color: '#CFB991' // Use Purdue gold for all routes
          });
        }
      });
      setAvailableRoutes(Array.from(routesMap.values()));

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading buses:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Filter buses by selected routes
    if (selectedRoutes.size === 0) {
      setFilteredBuses(buses);
    } else {
      setFilteredBuses(buses.filter(bus => selectedRoutes.has(bus.route_id)));
    }
  }, [buses, selectedRoutes]);

  function toggleRoute(routeId: number) {
    setSelectedRoutes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  }

  function toggleAllRoutes() {
    if (selectedRoutes.size === 0) {
      // Select all routes
      setSelectedRoutes(new Set(availableRoutes.map(r => r.id)));
    } else {
      // Deselect all
      setSelectedRoutes(new Set());
    }
  }

  async function fetchLiveData() {
    try {
      setRefreshing(true);
      const response = await fetch('/api/jagline/sync');
      if (!response.ok) throw new Error('Failed to sync data');

      const result = await response.json();
      console.log('Synced buses:', result.count);

      // Reload from database
      await loadBuses();
    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      setRefreshing(false);
    }
  }

  function getDirectionFromHeading(heading: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  }

  function getTimeSinceUpdate(timestamp: string): string {
    const now = new Date();
    const updated = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - updated.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading buses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-black text-[#CFB991] p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-[#CFB991] hover:text-[#CEB888]">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Jagline Live Buses</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#CFB991] hover:text-[#CEB888]"
            onClick={fetchLiveData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center justify-between text-sm text-[#CFB991]/80">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {lastUpdate ? `Updated ${getTimeSinceUpdate(lastUpdate.toISOString())}` : 'Never updated'}
            </span>
          </div>
          <Badge variant="secondary" className="bg-[#CFB991] text-black">
            {buses.length} buses active
          </Badge>
        </div>
      </header>

      {/* View Toggle and Route Filter */}
      <div className="p-3 bg-white border-b">
        <div className="flex gap-2 mb-2">
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("map")}
            className="flex-1"
          >
            <MapIcon className="h-4 w-4 mr-1" />
            Map
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex-1"
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>

        {/* Route Filter */}
        {availableRoutes.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Filter by Route:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllRoutes}
                className="text-xs h-6 px-2"
              >
                {selectedRoutes.size === 0 ? "All" : "Clear"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {availableRoutes.map(route => (
                <Button
                  key={route.id}
                  variant={selectedRoutes.size === 0 || selectedRoutes.has(route.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleRoute(route.id)}
                  style={{
                    backgroundColor: selectedRoutes.size === 0 || selectedRoutes.has(route.id) ? route.color : undefined,
                    borderColor: route.color
                  }}
                  className="text-[10px] h-6 px-2 py-0"
                >
                  {route.name.replace('Route ', '').replace(' – ', ' ')}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-2 bg-[#CFB991] text-black">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xl font-bold">{filteredBuses.length}</div>
            <div className="text-[10px] opacity-70">Active</div>
          </div>
          <div>
            <div className="text-xl font-bold">
              {filteredBuses.filter(b => b.is_on_route).length}
            </div>
            <div className="text-[10px] opacity-70">On Route</div>
          </div>
          <div>
            <div className="text-xl font-bold">
              {filteredBuses.filter(b => b.is_delayed).length}
            </div>
            <div className="text-[10px] opacity-70">Delayed</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 pb-20">
        {viewMode === "map" ? (
          <div className="h-[calc(100vh-270px)]">
            <BusMap buses={filteredBuses} selectedRouteIds={selectedRoutes} />
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredBuses.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-2">No buses currently active</p>
                <p className="text-sm text-muted-foreground">
                  Buses will appear here when they are running
                </p>
                <Button onClick={fetchLiveData} className="mt-4" disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Now
                </Button>
              </Card>
            ) : (
              filteredBuses.map((bus) => (
                <Card key={bus.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Bus Icon */}
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-black text-2xl font-bold"
                      style={{ backgroundColor: '#CFB991' }}
                    >
                      🚌
                    </div>

                    {/* Bus Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">Bus {bus.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {bus.route?.route_name || `Route ${bus.route_id}`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {bus.is_on_route ? (
                            <Badge variant="default" className="bg-green-600 text-xs">
                              On Route
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Off Route
                            </Badge>
                          )}
                          {bus.is_delayed && (
                            <Badge variant="destructive" className="text-xs">
                              Delayed
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <Gauge className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{bus.ground_speed.toFixed(0)} mph</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {getDirectionFromHeading(bus.heading)} ({bus.heading}°)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-xs">
                            {getTimeSinceUpdate(bus.last_updated)}
                          </span>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="bg-muted rounded p-2 text-xs">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">Location: </span>
                            <span className="font-mono">
                              {bus.latitude.toFixed(5)}, {bus.longitude.toFixed(5)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View on Map Button */}
                      <Button
                        className="w-full mt-3"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(
                            `https://www.google.com/maps?q=${bus.latitude},${bus.longitude}`,
                            '_blank'
                          );
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        View on Map
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
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
            Jagline
          </Button>
        </div>
      </nav>
    </div>
  );
}
