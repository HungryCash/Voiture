"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Map as MapIcon, List, X, Search } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import map to avoid SSR issues
const CityBusMap = dynamic(() => import("@/components/CityBusMap"), { ssr: false });

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

type LiveBus = {
  id: string;
  routeId: string;
  lat: number;
  lng: number;
  heading: number;
  nextStop: string;
  minutesAway: number;
};

const ROUTES: BusRoute[] = [
  {
    id: "discovery-park",
    name: "Discovery Park Loop",
    shortName: "D",
    color: "#CFB991",
    stops: [
      { id: "1", name: "Lynn Hall", address: "Horticulture Greenhouses, 250 West Lafayette, IN", lat: 40.4245, lng: -86.9165, routes: ["discovery-park"] },
      { id: "2", name: "CL50", address: "648 Oval Dr, West Lafayette, IN", lat: 40.4280, lng: -86.9220, routes: ["discovery-park"] },
      { id: "3", name: "Daniels / Russell", address: "Mitch Daniels Blv & Russell St, BUS547", lat: 40.4305, lng: -86.9250, routes: ["discovery-park", "purdue-mall"] },
      { id: "4", name: "MacArthur Dr", address: "Aspire Apts at Discovery Park, BUS011", lat: 40.4355, lng: -86.9270, routes: ["discovery-park"] },
      { id: "5", name: "Airport Rd / District Blvd", address: "1501 W State St, West Lafayette, IN", lat: 40.4125, lng: -86.9360, routes: ["discovery-park"] },
      { id: "6", name: "Niswonger", address: "1452 Aviation Dr, West Lafayette, IN", lat: 40.4085, lng: -86.9395, routes: ["discovery-park"] },
    ]
  },
  {
    id: "purdue-mall",
    name: "Purdue Mall Loop",
    shortName: "P",
    color: "#9CA3AF",
    stops: [
      { id: "7", name: "Armstrong", address: "Armstrong Hall on Stadium Ave, BUS190", lat: 40.4310, lng: -86.9180, routes: ["purdue-mall", "ross-ade"] },
      { id: "8", name: "Electrical Engineering", address: "Electrical Engineering at Shelter, BUS538", lat: 40.4295, lng: -86.9165, routes: ["purdue-mall", "ross-ade"] },
      { id: "9", name: "PMU", address: "425 W State St, West Lafayette, IN", lat: 40.4267, lng: -86.9196, routes: ["purdue-mall", "ross-ade"] },
      { id: "3", name: "Daniels / Russell", address: "Mitch Daniels Blv & Russell St, BUS547", lat: 40.4305, lng: -86.9250, routes: ["discovery-park", "purdue-mall"] },
      { id: "10", name: "Daniels / MacArthur", address: "Aspire Apts at Discovery Park, BUS011", lat: 40.4355, lng: -86.9270, routes: ["purdue-mall"] },
      { id: "11", name: "McCutcheon", address: "McCutcheon Hall on McCutcheon, BUS491E", lat: 40.4340, lng: -86.9245, routes: ["purdue-mall"] },
      { id: "12", name: "Hillenbrand", address: "1301 3rd Street, West Lafayette, IN", lat: 40.4315, lng: -86.9260, routes: ["purdue-mall"] },
      { id: "13", name: "CoRec", address: "RSC on Jischke Dr, BUS362", lat: 40.4285, lng: -86.9235, routes: ["purdue-mall"] },
    ]
  },
  {
    id: "ross-ade",
    name: "Ross-Ade Loop",
    shortName: "R",
    color: "#CFB991",
    stops: [
      { id: "7", name: "Armstrong", address: "Armstrong Hall on Stadium Ave, BUS190", lat: 40.4310, lng: -86.9180, routes: ["purdue-mall", "ross-ade"] },
      { id: "8", name: "Electrical Engineering", address: "Electrical Engineering at Shelter, BUS538", lat: 40.4295, lng: -86.9165, routes: ["purdue-mall", "ross-ade"] },
      { id: "9", name: "PMU", address: "425 W State St, West Lafayette, IN", lat: 40.4267, lng: -86.9196, routes: ["purdue-mall", "ross-ade"] },
      { id: "14", name: "Daniels/University", address: "Matthews (Mary L.) Hall, 812 W State St", lat: 40.4265, lng: -86.9275, routes: ["ross-ade"] },
      { id: "15", name: "Armory", address: "305 N University St, West Lafayette, IN", lat: 40.4289, lng: -86.9205, routes: ["ross-ade"] },
      { id: "16", name: "Tiller Dr", address: "850 Steven Beering Dr, West Lafayette, IN", lat: 40.4335, lng: -86.9210, routes: ["ross-ade"] },
      { id: "17", name: "Hilltop", address: "Tower Dr & Hilltop Dr, BUS472N", lat: 40.4380, lng: -86.9240, routes: ["ross-ade"] },
      { id: "18", name: "David Ross Rd / Tower Dr", address: "800 David Ross Rd, West Lafayette, IN", lat: 40.4400, lng: -86.9200, routes: ["ross-ade"] },
    ]
  }
];

export default function CityBusPage() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set(ROUTES.map(r => r.id)));
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoutes = ROUTES.filter(route => selectedRoutes.has(route.id));
  const allStops = ROUTES.flatMap(route => route.stops).filter((stop, index, self) =>
    self.findIndex(s => s.id === stop.id) === index
  );

  function toggleRoute(routeId: string) {
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
    if (selectedRoutes.size === ROUTES.length) {
      setSelectedRoutes(new Set());
    } else {
      setSelectedRoutes(new Set(ROUTES.map(r => r.id)));
    }
  }

  const filteredStops = allStops.filter(stop =>
    stop.routes.some(routeId => selectedRoutes.has(routeId))
  );

  const searchFilteredRoutes = ROUTES.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-black text-[#CFB991] p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-[#CFB991] hover:text-[#CEB888]">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Purdue Campus Transit</h1>
          </div>
        </div>
        <p className="text-sm text-[#CFB991]/80 mt-2">Fixed Route Shuttle Tracker</p>
      </header>

      {/* View Toggle */}
      <div className="p-3 bg-white border-b">
        <div className="flex gap-2">
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
      </div>

      {/* Route Filter Bar */}
      <div className="p-3 bg-[#CFB991] text-black">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRouteModal(true)}
          className="w-full justify-between bg-white"
        >
          <span className="font-medium">Filter by Route</span>
          <Badge variant="secondary" className="bg-black text-[#CFB991]">
            {selectedRoutes.size === 0 ? "All" : selectedRoutes.size}
          </Badge>
        </Button>
      </div>

      {/* Route Selection Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-hidden relative z-[10000]">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Service</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowRouteModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              <p className="text-sm text-muted-foreground">
                Vehicles are running on these routes:
              </p>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search Route"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CFB991]"
                />
              </div>

              {/* Deselect All Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">
                  Deselect all ({ROUTES.length})
                </span>
                <button
                  onClick={toggleAllRoutes}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    selectedRoutes.size === ROUTES.length ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selectedRoutes.size === ROUTES.length ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Routes */}
              <div className="space-y-2">
                {searchFilteredRoutes.map(route => (
                  <div
                    key={route.id}
                    onClick={() => toggleRoute(route.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRoutes.has(route.id) ? 'bg-gray-100' : 'bg-white'
                    } border hover:border-[#CFB991]`}
                  >
                    <span className="font-medium">{route.name}</span>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: route.color }}
                    >
                      {route.shortName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1">
        {viewMode === "map" ? (
          <div className="h-[calc(100vh-200px)]">
            <CityBusMap
              routes={filteredRoutes}
              stops={filteredStops}
              onStopClick={setSelectedStop}
            />
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredRoutes.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-2">No routes selected</p>
                <p className="text-sm text-muted-foreground">
                  Select routes from the filter to view them
                </p>
                <Button onClick={() => setShowRouteModal(true)} className="mt-4">
                  Select Routes
                </Button>
              </Card>
            ) : (
              filteredRoutes.map((route) => (
                <Card key={route.id} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: route.color }}
                    >
                      {route.shortName}
                    </div>
                    <div>
                      <h3 className="font-bold">{route.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {route.stops.length} stops
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {route.stops.map((stop, index) => (
                      <div key={stop.id} className="flex items-start gap-2 text-sm">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: route.color }}
                          >
                            <MapPin className="h-3 w-3" />
                          </div>
                          {index < route.stops.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="font-medium">{stop.name}</p>
                          <p className="text-xs text-muted-foreground">{stop.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {/* Selected Stop Panel */}
      {selectedStop && (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl border-t-2 border-[#CFB991] p-4 max-h-[50vh] overflow-y-auto z-[9998] max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#CFB991] flex items-center justify-center">
                <MapPin className="h-5 w-5 text-black" />
              </div>
              <h3 className="font-bold text-lg">{selectedStop.name}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedStop(null)}
              className="hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4 pl-10">{selectedStop.address}</p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">NEXT SHUTTLES</p>
            {selectedStop.routes.map(routeId => {
              const route = ROUTES.find(r => r.id === routeId);
              if (!route) return null;
              return (
                <div key={routeId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                    style={{ backgroundColor: route.color }}
                  >
                    {route.shortName}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{route.name}</p>
                    <p className="text-xs text-muted-foreground">19 FREE</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#CFB991] text-lg">2 mins</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
