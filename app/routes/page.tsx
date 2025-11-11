/**
 * Routes page
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, DollarSign, RefreshCw, MapPin } from "lucide-react";
import Link from "next/link";

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
  const [sortBy, setSortBy] = useState<"fastest" | "cheapest" | "convenient">("fastest");

  // Mock data - This will be replaced with actual API data
  const routes: RouteOption[] = [
    {
      id: "1",
      type: "Bus",
      duration: "21h 18min",
      price: "$115-220",
      transfers: 1,
      modes: ["Bus"],
      badge: "BEST",
      steps: [
        {
          mode: "walk",
          name: "Walk to bus stop",
          duration: "5min",
          from: "West Lafayette",
          to: "CityBus Stop",
          icon: "🚶",
        },
        {
          mode: "bus",
          name: "CityBus 4B Silver Loop",
          duration: "15min",
          from: "Campus",
          to: "Union",
          icon: "🚌",
        },
        {
          mode: "bus",
          name: "Jagline Express",
          duration: "21h",
          from: "West Lafayette",
          to: "Indianapolis",
          icon: "🚍",
        },
      ],
    },
    {
      id: "2",
      type: "Bus, Train",
      duration: "21h 56min",
      price: "$122-610",
      transfers: 2,
      modes: ["Bus", "Train"],
      steps: [
        {
          mode: "bus",
          name: "CityBus to Station",
          duration: "20min",
          from: "Campus",
          to: "Train Station",
          icon: "🚌",
        },
        {
          mode: "train",
          name: "Amtrak Cardinal",
          duration: "21h",
          from: "Lafayette",
          to: "Indianapolis",
          icon: "🚂",
        },
      ],
    },
    {
      id: "3",
      type: "Campus Shuttle",
      duration: "2h 30min",
      price: "$45-80",
      transfers: 0,
      modes: ["Shuttle"],
      badge: "CHEAPEST",
      steps: [
        {
          mode: "shuttle",
          name: "Campus Direct Shuttle",
          duration: "2h 30min",
          from: "West Lafayette",
          to: "Indianapolis",
          icon: "🚐",
        },
      ],
    },
    {
      id: "4",
      type: "Drive",
      duration: "1h 13min",
      price: "$16-24",
      transfers: 0,
      modes: ["Car"],
      steps: [
        {
          mode: "car",
          name: "Drive via I-65 S",
          duration: "1h 13min",
          from: "West Lafayette",
          to: "Indianapolis",
          icon: "🚗",
        },
      ],
    },
    {
      id: "5",
      type: "Scooter + Bus",
      duration: "22h 5min",
      price: "$120-225",
      transfers: 2,
      modes: ["Scooter", "Bus"],
      badge: "ECO-FRIENDLY",
      steps: [
        {
          mode: "scooter",
          name: "Veo Scooter",
          duration: "12min",
          from: "Campus",
          to: "Bus Station",
          icon: "🛴",
        },
        {
          mode: "bus",
          name: "Jagline Express",
          duration: "21h 53min",
          from: "West Lafayette",
          to: "Indianapolis",
          icon: "🚍",
        },
      ],
    },
    {
      id: "6",
      type: "Fly",
      duration: "4h 27min",
      price: "$113-389",
      transfers: 1,
      modes: ["Flight"],
      steps: [
        {
          mode: "bus",
          name: "Campus Bus to Airport",
          duration: "25min",
          from: "Campus",
          to: "Purdue Airport",
          icon: "🚌",
        },
        {
          mode: "flight",
          name: "Regional Flight",
          duration: "45min",
          from: "Purdue Airport (LAF)",
          to: "Indianapolis Airport (IND)",
          icon: "✈️",
        },
      ],
    },
  ];

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
            <span>West Lafayette</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <MapPin className="h-4 w-4 text-red-400" />
            <span>Indianapolis</span>
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
        {sortedRoutes.map((route) => (
          <Card key={route.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            {/* Route Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{route.type}</h3>
                  {route.badge && (
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

            {/* View Details Button */}
            <Button variant="outline" className="w-full mt-2" size="sm">
              View Details
            </Button>
          </Card>
        ))}
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
    </div>
  );
}
