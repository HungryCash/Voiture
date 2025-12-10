/**
 * Routes page
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import RouteMap from "@/components/RouteMap";
import { ArrowLeft, Clock, DollarSign, RefreshCw, MapPin, HelpCircle, Bookmark } from "lucide-react";
import Link from "next/link";
import { findRoutes } from "@/lib/routing";

type RouteOption = {
  id: string;
  type: string;
  duration: string;
  price: string;
  transfers: number;
  modes: string[];
  badge?: string;
  steps: RouteStep[];
};

type RouteStep = {
  mode: string;
  name: string;
  duration: string;
  from: string;
  to: string;
  icon: string;
};

export default function RoutesPage() {
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin") || "PMU";
  const destination = searchParams.get("destination") || "Armstrong";

  const [sortBy, setSortBy] = useState<"fastest" | "cheapest" | "convenient">("fastest");
  const [showRecommendationInfo, setShowRecommendationInfo] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<Set<string>>(new Set());
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const infoRef = useRef<HTMLDivElement>(null);

  // Find routes when component mounts or origin/destination changes
  useEffect(() => {
    async function loadRoutes() {
      const foundRoutes = await findRoutes(origin, destination);
      setRoutes(foundRoutes);
    }
    loadRoutes();
  }, [origin, destination]);

  const toggleSaveRoute = (routeId: string) => {
    setSavedRoutes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  const handleViewDetails = (route: RouteOption) => {
    setSelectedRoute(route);
    setIsMapDialogOpen(true);
  };

  // Extract origin and destination from route steps
  const getRouteEndpoints = (route: RouteOption | null) => {
    if (!route || route.steps.length === 0) {
      return { origin: "West Lafayette", destination: "Indianapolis" };
    }
    const firstStep = route.steps[0];
    const lastStep = route.steps[route.steps.length - 1];
    return {
      origin: firstStep.from,
      destination: lastStep.to,
    };
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowRecommendationInfo(false);
      }
    };

    if (showRecommendationInfo) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRecommendationInfo]);

  // Close tooltip when sort option changes
  useEffect(() => {
    setShowRecommendationInfo(false);
  }, [sortBy]);


  const sortedRoutes = [...routes].sort((a, b) => {
    if (sortBy === "fastest") {
      return parseInt(a.duration) - parseInt(b.duration);
    } else if (sortBy === "cheapest") {
      return parseInt(a.price.replace(/[^0-9]/g, "")) - parseInt(b.price.replace(/[^0-9]/g, ""));
    } else {
      return a.transfers - b.transfers;
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="ml-3 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-green-400" />
            <span>{origin}</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <MapPin className="h-4 w-4 text-red-400" />
            <span>{destination}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-primary-foreground">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </header>

      {/* Sort Options */}
      <div className="bg-background border-b p-3 sticky top-[72px] z-10">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={sortBy === "fastest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("fastest")}
            className="whitespace-nowrap"
          >
            <Clock className="h-4 w-4 mr-1" />
            Fastest
          </Button>
          <Button
            variant={sortBy === "cheapest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("cheapest")}
            className="whitespace-nowrap"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Cheapest
          </Button>
          <Button
            variant={sortBy === "convenient" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("convenient")}
            className="whitespace-nowrap"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Least Transfers
          </Button>
        </div>
      </div>

      {/* Routes List */}
      <main className="flex-1 p-4 space-y-3 pb-20">
        {sortedRoutes.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Routes Found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              We couldn't find any routes between these locations.
              <br />
              Try searching for campus locations like PMU, Armstrong, or Lynn Hall.
            </p>
            <Link href="/">
              <Button>
                Back to Home
              </Button>
            </Link>
          </Card>
        ) : (
          sortedRoutes.map((route, index) => (
          <Card key={route.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            {/* Route Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{route.type}</h3>
                  {index === 0 && (
                    <div ref={infoRef} className="relative flex items-center gap-1">
                      <Badge variant="default" className="text-[0.7rem] px-1.5 py-0 font-normal leading-tight">
                        Recommended
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRecommendationInfo(!showRecommendationInfo);
                        }}
                        className="relative"
                        type="button"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                        {showRecommendationInfo && (
                          <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-card border border-border rounded-md shadow-lg text-sm">
                            <p className="text-card-foreground">
                              This route is recommended based on a balance of <strong>cost-effectiveness</strong> and <strong>travel time</strong>, optimized for your selected sorting preference.
                            </p>
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                  {route.badge && index !== 0 && (
                    <Badge
                      variant={
                        route.badge === "BEST"
                          ? "default"
                          : route.badge === "CHEAPEST"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {route.badge}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {route.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {route.price}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">{route.price.split("-")[0]}</div>
                <div className="text-xs text-muted-foreground">
                  {route.transfers === 0 ? "Direct" : `${route.transfers} transfer${route.transfers > 1 ? "s" : ""}`}
                </div>
              </div>
            </div>

            {/* Route Steps */}
            <div className="space-y-2 border-l-2 border-dashed border-muted pl-4 ml-2">
              {route.steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-[22px] w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs">
                    {step.icon}
                  </div>
                  <div className="pb-3">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {step.from} → {step.to} • {step.duration}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View Details Button and Bookmark */}
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(route);
                }}
              >
                View Details
              </Button>
              <Button
                variant={savedRoutes.has(route.id) ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaveRoute(route.id);
                }}
                className="px-3"
              >
                <Bookmark
                  className={`h-4 w-4 ${savedRoutes.has(route.id) ? "fill-current" : ""}`}
                />
              </Button>
            </div>
          </Card>
        )))}
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t bg-background p-4 fixed bottom-0 left-0 right-0 max-w-md mx-auto">
        <div className="flex justify-around">
          <Link href="/">
            <Button variant="ghost" className="flex-1">
              Home
            </Button>
          </Link>
          <Button variant="default" className="flex-1">
            Routes
          </Button>
          <Button variant="ghost" className="flex-1">
            Saved
          </Button>
        </div>
      </nav>

      {/* Map Dialog */}
      <Dialog
        open={isMapDialogOpen}
        onOpenChange={setIsMapDialogOpen}
        title={selectedRoute ? `Route: ${selectedRoute.type}` : "Route Details"}
      >
        <div className="h-[600px]">
          {selectedRoute && (() => {
            const { origin, destination } = getRouteEndpoints(selectedRoute);
            return (
              <RouteMap
                origin={origin}
                destination={destination}
              />
            );
          })()}
        </div>
      </Dialog>
    </div>
  );
}
